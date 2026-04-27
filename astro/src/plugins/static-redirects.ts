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
  for (const from in redirects) {
    const redirect = redirects[from];
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

  // Detect duplicate redirect_from entries across content files.
  // We cannot detect duplicates from config.redirects alone: astro-redirect-from
  // builds a plain JS object from frontmatter, so when two files declare the same
  // redirect_from path, the second silently overwrites the first before our hook
  // ever runs. Scanning frontmatter directly is the only way to catch these.
  await detectDuplicateRedirects(logger);
}

async function detectDuplicateRedirects(logger: AstroIntegrationLogger) {
  const contentDir = path.join(process.cwd(), "src/content/docs");
  const files = await globby("./**/*.{md,mdx}", {
    cwd: contentDir,
    gitignore: true,
  });

  // Map each redirect source path to the list of files that claim it
  const sourceToFiles = new Map<string, string[]>();

  for (const file of files) {
    const filePath = path.join(contentDir, file);

    // Read only enough to extract frontmatter — avoid loading full file bodies
    const handle = await fs.open(filePath, "r");
    try {
      const buf = Buffer.alloc(8192);
      const { bytesRead } = await handle.read(buf, 0, 8192, 0);
      const head = buf.toString("utf-8", 0, bytesRead);

      // Quick check: skip files without redirect_from in the frontmatter region
      if (!head.includes("redirect_from")) continue;

      // Only now read the full file for proper YAML parsing
      const content = bytesRead < 8192
        ? head
        : await fs.readFile(filePath, { encoding: "utf-8" });
      const { data: frontmatter } = matter(content);

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
    } finally {
      await handle.close();
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
