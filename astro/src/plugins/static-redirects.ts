import url from "node:url";
import type { AstroConfig, AstroIntegrationLogger } from "astro";
import path from "node:path";
import fs from "node:fs/promises";
import { globby } from "globby";
import matter from "gray-matter";

const redirectMap = new Map<string, string>();

export async function configurePlugin(hookOptions: any) {
  const buildOutput: string = hookOptions.buildOutput;
  const config: AstroConfig = hookOptions.config;
  const logger: AstroIntegrationLogger = hookOptions.logger;

  if (buildOutput !== "static") {
    logger.warn(
      `Skip generating static redirects: not compatible with '${buildOutput}' builds, only 'static' is supported.`,
    );
    return;
  }

  // Find redirects
  const redirects = config.redirects;
  if (!Object.keys(redirects).length) {
    logger.warn("Skip generating static redirects: no redirects found.");
    return;
  }

  // Build redirect map
  logger.info("Generating static redirects file...");
  for (const [from, redirect] of Object.entries(redirects)) {
    const destination =
      typeof redirect === "string" ? redirect : redirect.destination;

    // Normalize: strip trailing slash from source for consistent matching
    const normalizedFrom = from.endsWith("/") ? from.slice(0, -1) : from;

    // Ensure destination has trailing slash
    const normalizedTo = destination.endsWith("/")
      ? destination
      : destination + "/";

    redirectMap.set(normalizedFrom, normalizedTo);
  }

  const contentDir = path.join(
    url.fileURLToPath(config.srcDir),
    "content",
    "docs",
  );

  // Detect duplicate redirect_from entries across content files.
  // We cannot detect duplicates from config.redirects alone: astro-redirect-from
  // builds a plain JS object from frontmatter, so when two files declare the same
  // redirect_from path, the second silently overwrites the first before our hook
  // ever runs. Scanning frontmatter directly is the only way to catch these.
  await detectDuplicateRedirects(logger, contentDir);
}

/**
 * Reads a file in chunks until the closing `---` of the YAML frontmatter block
 * is found, then returns only those bytes. This avoids loading the full file
 * body. The loop keeps reading until the delimiter is seen or EOF is reached.
 */
async function extractFrontmatterBlock(filePath: string): Promise<string> {
  const CHUNK_SIZE = 4096;
  const handle = await fs.open(filePath, "r");
  try {
    let accumulated = "";
    let offset = 0;
    let firstChunk = true;
    // searchFrom tracks how far we've already scanned for the closing delimiter
    // so each chunk addition only rescans the newly added bytes.
    let searchFrom = 0;

    while (true) {
      const buf = Buffer.alloc(CHUNK_SIZE);
      const { bytesRead } = await handle.read(buf, 0, CHUNK_SIZE, offset);
      if (bytesRead === 0) break;

      const chunk = buf.toString("utf-8", 0, bytesRead);
      accumulated += chunk;
      offset += bytesRead;

      // After reading the first chunk, bail out early for files without frontmatter
      if (firstChunk) {
        firstChunk = false;
        if (!accumulated.startsWith("---")) return "";
        // Skip past the opening --- line before searching for the closing one
        searchFrom = accumulated.indexOf("\n") + 1;
      }

      // Search for the closing --- delimiter starting where we left off
      const closingIdx = accumulated.indexOf("\n---", searchFrom);
      if (closingIdx !== -1) {
        // Include the closing delimiter line in the returned block
        const endIdx = accumulated.indexOf("\n", closingIdx + 1);
        return endIdx === -1
          ? accumulated.slice(0, closingIdx + 4)
          : accumulated.slice(0, endIdx + 1);
      }

      // Advance searchFrom so the next iteration only scans the new chunk,
      // minus a small overlap to avoid splitting a \n--- across chunk boundaries.
      searchFrom = Math.max(searchFrom, accumulated.length - 4);

      if (bytesRead < CHUNK_SIZE) break; // reached EOF before closing delimiter
    }

    // No closing --- found. gray-matter returns empty data for malformed
    // frontmatter, so the caller's redirect_from check will safely skip this file.
    return accumulated;
  } finally {
    await handle.close();
  }
}

async function detectDuplicateRedirects(
  logger: AstroIntegrationLogger,
  contentDir: string,
) {
  const files = await globby("./**/*.{md,mdx}", {
    cwd: contentDir,
    gitignore: true,
  });

  // Map each redirect source path to the list of files that claim it
  const sourceToFiles = new Map<string, string[]>();

  for (const file of files) {
    const filePath = path.join(contentDir, file);

    // Read only the frontmatter block, scanning until the closing --- delimiter
    // regardless of how large the frontmatter may be.
    const frontmatterBlock = await extractFrontmatterBlock(filePath);

    if (!frontmatterBlock.includes("redirect_from")) continue;

    const { data: frontmatter } = matter(frontmatterBlock);

    if (!frontmatter?.redirect_from) continue;

    const redirectFrom: string[] = Array.isArray(frontmatter.redirect_from)
      ? frontmatter.redirect_from
      : [frontmatter.redirect_from];

    for (const source of redirectFrom) {
      const normalized = source.endsWith("/") ? source.slice(0, -1) : source;
      const existing = sourceToFiles.get(normalized);
      if (existing) {
        existing.push(file);
      } else {
        sourceToFiles.set(normalized, [file]);
      }
    }
  }

  let duplicateCount = 0;
  for (const [source, claimingFiles] of sourceToFiles) {
    if (claimingFiles.length > 1) {
      if (duplicateCount === 0) {
        logger.error("Duplicate redirect_from entries detected:");
      }
      duplicateCount++;
      logger.error(
        `  "${source}" is claimed by ${claimingFiles.length} files: ${claimingFiles.join(", ")}`,
      );
    }
  }

  if (duplicateCount > 0) {
    throw new Error(
      `Build failed: ${duplicateCount} duplicate redirect_from source(s) detected. See log above for details.`,
    );
  }
}

export async function writeToOutput(hookOptions: any) {
  const outDir: string = hookOptions.dir;
  const logger: AstroIntegrationLogger = hookOptions.logger;

  if (redirectMap.size === 0) {
    logger.warn(
      `Skip generating static redirects file: no redirects were generated.`,
    );
    return;
  }

  // Write redirects.json by streaming to avoid a full in-memory JSON string
  const jsonDestinationPath = path.join(
    url.fileURLToPath(outDir),
    "redirects.json",
  );
  const handle = await fs.open(jsonDestinationPath, "w");
  try {
    let first = true;
    await handle.write("{\n");
    for (const [key, value] of redirectMap) {
      if (!first) await handle.write(",\n");
      await handle.write(`  ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
      first = false;
    }
    await handle.write("\n}\n");
  } finally {
    await handle.close();
  }

  logger.info(
    `Generated ${redirectMap.size} redirects: ${jsonDestinationPath}`,
  );
}

export default function staticRedirects() {
  return {
    name: "static-redirects",
    hooks: {
      "astro:config:done": async (hookOptions: any) =>
        await configurePlugin(hookOptions),
      "astro:build:done": async (hookOptions: any) =>
        await writeToOutput(hookOptions),
    },
  };
}
