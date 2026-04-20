import path from "node:path";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import url from "node:url";
import type { AstroIntegrationLogger } from "astro";

const SKILLS_REPO = "DuendeSoftware/duende-skills";
const SKILLS_BRANCH = "main";
const SKILLS_PATH = "skills";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${SKILLS_REPO}/${SKILLS_BRANCH}`;
const GITHUB_API_BASE = `https://api.github.com/repos/${SKILLS_REPO}/contents`;

interface SkillFrontmatter {
  name: string;
  description: string;
}

interface SkillEntry {
  name: string;
  type: "skill-md";
  description: string;
  url: string;
  digest: string;
}

function parseFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim();

  if (!name || !description) return null;
  return { name, description };
}

function computeDigest(content: string): string {
  const hash = createHash("sha256").update(content).digest("hex");
  return `sha256:${hash}`;
}

async function fetchSkillDirectories(
  logger: AstroIntegrationLogger,
): Promise<string[]> {
  const apiUrl = `${GITHUB_API_BASE}/${SKILLS_PATH}?ref=${SKILLS_BRANCH}`;
  logger.info(`Fetching skill list from ${apiUrl}`);

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "duende-docs-agent-skills",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch skills directory: ${response.status} ${response.statusText}`,
    );
  }

  const entries = (await response.json()) as Array<{
    name: string;
    type: string;
  }>;
  return entries.filter((e) => e.type === "dir").map((e) => e.name);
}

async function fetchSkillContent(skillName: string): Promise<string> {
  const skillUrl = `${GITHUB_RAW_BASE}/${SKILLS_PATH}/${skillName}/SKILL.md`;
  const response = await fetch(skillUrl, {
    headers: { "User-Agent": "duende-docs-agent-skills" },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${skillUrl}: ${response.status} ${response.statusText}`,
    );
  }

  return await response.text();
}

async function generateAgentSkills(
  outDir: string,
  logger: AstroIntegrationLogger,
): Promise<void> {
  const wellKnownDir = path.join(outDir, ".well-known", "agent-skills");
  await fs.mkdir(wellKnownDir, { recursive: true });

  // Fetch list of skill directories
  const skillDirs = await fetchSkillDirectories(logger);
  logger.info(`Found ${skillDirs.length} skills to process`);

  const skills: SkillEntry[] = [];

  for (const skillName of skillDirs) {
    try {
      const content = await fetchSkillContent(skillName);
      const frontmatter = parseFrontmatter(content);

      if (!frontmatter) {
        logger.warn(`Skipping ${skillName}: could not parse frontmatter`);
        continue;
      }

      // Write SKILL.md to output
      const skillDir = path.join(wellKnownDir, skillName);
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, "SKILL.md"), content);

      // Add to index
      skills.push({
        name: frontmatter.name,
        type: "skill-md",
        description: frontmatter.description,
        url: `/.well-known/agent-skills/${skillName}/SKILL.md`,
        digest: computeDigest(content),
      });

      logger.info(`  ✓ ${frontmatter.name}`);
    } catch (err) {
      logger.warn(
        `Failed to process skill ${skillName}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Write index.json
  const index = {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills,
  };

  await fs.writeFile(
    path.join(wellKnownDir, "index.json"),
    JSON.stringify(index, null, 2),
  );

  logger.info(
    `Generated agent-skills discovery index with ${skills.length} skills`,
  );
}

export default function agentSkillsDiscovery() {
  return {
    name: "agent-skills-discovery",
    hooks: {
      "astro:build:done": async (hookOptions: any) => {
        const outDir: string = url.fileURLToPath(hookOptions.dir);
        const logger: AstroIntegrationLogger = hookOptions.logger;

        try {
          await generateAgentSkills(outDir, logger);
        } catch (err) {
          logger.error(
            `Failed to generate agent-skills discovery: ${err instanceof Error ? err.message : err}`,
          );
        }
      },
    },
  };
}
