import url from "node:url";
import type { AstroConfig, AstroIntegrationLogger } from "astro";
import path from "node:path";
import fs from "node:fs/promises";

let configJson = { routes: [] };

export async function configurePlugin(hookOptions: any) {
  const buildOutput: string = hookOptions.buildOutput;
  const config: AstroConfig = hookOptions.config;
  const logger: AstroIntegrationLogger = hookOptions.logger;

  if (buildOutput !== "static") {
    logger.warn(
      `Skip generating static redirects file: not compatible with '${buildOutput}' builds, only 'static' is supported.`,
    );
    return;
  }

  // Find redirects
  const redirects = config.redirects;
  if (!Object.keys(redirects).length) {
    logger.warn("Skip generating static redirects file: no redirects found.");
    return;
  }

  // Load existing staticwebapp.config.json
  const configSourcePath = path.join(
    url.fileURLToPath(config.srcDir),
    "staticwebapp.config.json",
  );

  try {
    configJson = JSON.parse(
      await fs.readFile(configSourcePath, {
        encoding: "utf-8",
      }),
    );

    if (!configJson.routes) {
      configJson.routes = [];
    }
  } catch {
    logger.debug(
      `Skip load existing config file: '${configSourcePath}' not found.`,
    );
  }

  // Add redirects
  logger.info("Generating static redirects file...");
  Object.keys(redirects).forEach((from) => {
    const redirect = redirects[from];

    if (typeof redirect === "string") {
      // @ts-ignore
      configJson.routes.push({
        route: from,
        methods: ["GET"],
        redirect: redirect,
        statusCode: 301,
      });
    } else {
      // @ts-ignore
      configJson.routes.push({
        route: from,
        methods: ["GET"],
        redirect: redirect.destination,
        statusCode: redirect.status,
      });
    }
  });
}

export async function writeToOutput(hookOptions: any) {
  const outDir: string = hookOptions.dir;
  const logger: AstroIntegrationLogger = hookOptions.logger;

  if (!configJson || !configJson.routes.length) {
    logger.warn(
      `Skip generating static redirects file: no redirects were generated.`,
    );
    return;
  }

  // Write staticwebapp.config.json
  const configDestinationPath = path.join(
    url.fileURLToPath(outDir),
    "staticwebapp.config.json",
  );
  await fs.writeFile(
    configDestinationPath,
    JSON.stringify(configJson, null, 2),
  );
  logger.info(
    `Generated static redirects file: ${configDestinationPath} (${configJson.routes.length} redirects)`,
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
