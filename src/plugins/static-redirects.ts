import url from "node:url";
import type { AstroConfig, AstroIntegrationLogger } from "astro";
import path from "node:path";
import fs from "node:fs/promises";

function createNginxRule(redirectFrom: string, redirectTo: string) {
  if (redirectFrom.endsWith("/")) {
    redirectFrom = redirectFrom.slice(0, -1);
  }

  return (
    "rewrite ^" +
    redirectFrom +
    "(/?)$ $scheme://$http_host" +
    redirectTo +
    "/ permanent;\n"
  );
}

let nginxRedirectRules = "";

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

  // Add redirects
  logger.info("Generating static redirects file...");
  Object.keys(redirects).forEach((from) => {
    const redirect = redirects[from];

    if (typeof redirect === "string") {
      nginxRedirectRules += createNginxRule(from, redirect);
    } else {
      nginxRedirectRules += createNginxRule(from, redirect.destination);
    }
  });
}

export async function writeToOutput(hookOptions: any) {
  const outDir: string = hookOptions.dir;
  const logger: AstroIntegrationLogger = hookOptions.logger;

  if (!nginxRedirectRules || !nginxRedirectRules.length) {
    logger.warn(
      `Skip generating static redirects file: no redirects were generated.`,
    );
    return;
  }

  // Write redirect.conf
  const configDestinationPath = path.join(
    url.fileURLToPath(outDir),
    "redirect.conf",
  );
  await fs.writeFile(configDestinationPath, nginxRedirectRules);
  logger.info(`Generated static redirects file: ${configDestinationPath}`);
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
