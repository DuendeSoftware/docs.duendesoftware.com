import url from "node:url";
import type { AstroConfig, AstroIntegrationLogger } from "astro";
import path from "node:path";
import fs from "node:fs/promises";

const redirectMap: Record<string, string> = {};

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
  Object.keys(redirects).forEach((from) => {
    const redirect = redirects[from];
    const destination =
      typeof redirect === "string" ? redirect : redirect.destination;

    // Normalize: strip trailing slash from source for consistent matching
    const normalizedFrom = from.endsWith("/") ? from.slice(0, -1) : from;
    // Ensure destination has trailing slash
    const normalizedTo = destination.endsWith("/")
      ? destination
      : destination + "/";

    redirectMap[normalizedFrom] = normalizedTo;
  });
}

export async function writeToOutput(hookOptions: any) {
  const outDir: string = hookOptions.dir;
  const logger: AstroIntegrationLogger = hookOptions.logger;

  if (!Object.keys(redirectMap).length) {
    logger.warn(
      `Skip generating static redirects file: no redirects were generated.`,
    );
    return;
  }

  // Write redirects.json
  const jsonDestinationPath = path.join(
    url.fileURLToPath(outDir),
    "redirects.json",
  );
  await fs.writeFile(jsonDestinationPath, JSON.stringify(redirectMap, null, 2));
  logger.info(
    `Generated ${Object.keys(redirectMap).length} redirects: ${jsonDestinationPath}`,
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
