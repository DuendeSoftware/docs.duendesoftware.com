import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import picomatch from "picomatch";
import type { AstroIntegration } from "astro";

export interface ContributorMappingOptions {
  /**
   * Glob patterns for files to include in the contributors map.
   * Matched against paths relative to the Astro project root.
   * @example ["src/content/docs/**"]
   */
  include: string[];

  /**
   * GitHub repository in "owner/repo" format, used to resolve commit authors
   * via the GitHub Commits API.
   * @example "DuendeSoftware/docs.duendesoftware.com"
   */
  repo: string;
}

/**
 * Astro integration that generates src/data/contributors.json at build start.
 *
 * - Collects unique emails from git log → resolves to GitHub usernames
 *   (noreply pattern first, then GitHub Commits API)
 * - Parses git log with rename detection (-M) to follow file history across
 *   renames (e.g. .md → .mdx, directory moves)
 * - Outputs { [filePath]: Contributor[] } scoped to the configured include globs
 *
 * Set GITHUB_TOKEN env var to avoid API rate limiting
 * (unauthenticated: 60 req/hr, authenticated: 5000 req/hr).
 */
export default function contributorMapping(
  options: ContributorMappingOptions
): AstroIntegration {
  const { include, repo } = options;

  return {
    name: "contributor-mapping",
    hooks: {
      "astro:config:setup": async ({ logger }) => {
        await generateContributors(include, repo, logger);
      },
    },
  };
}

interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
}

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
const outPath = resolve(dataDir, "contributors.json");

function getGitRootDir(): string {
  try {
    return execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      cwd: projectDir,
    }).trim();
  } catch {
    return projectDir;
  }
}

function getGitPrefix(): string {
  try {
    return execSync("git rev-parse --show-prefix", {
      encoding: "utf-8",
      cwd: projectDir,
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Resolve git author emails to GitHub usernames.
 *
 * 1. Noreply email pattern (free, instant)
 * 2. GitHub Commits API — look up a commit by that author and read the
 *    linked GitHub account (authoritative, 1 API call per email)
 */
async function resolveEmails(
  repo: string,
  logger: Logger
): Promise<Record<string, string | null>> {
  let emailResult: string;
  try {
    // Don't scope to paths — we need emails from pre-rename history too
    emailResult = execSync('git log --format="%aE" | sort -u', {
      encoding: "utf-8",
      cwd: getGitRootDir(),
      maxBuffer: 10 * 1024 * 1024
    });
  } catch {
    logger.warn("git not available — skipping contributor mapping");
    return {};
  }

  const emails = emailResult.split("\n").map((e) => e.trim()).filter(Boolean);
  const mapping: Record<string, string | null> = {};
  const token = process.env.GITHUB_TOKEN || "";
  const headers: Record<string, string> = {
    "User-Agent": "docs-contributor-mapper",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const emailsNeedingApi: { email: string; sha: string }[] = [];
  let apiCalls = 0;
  let resolved = 0;

  for (const email of emails) {
    // 1. Noreply pattern
    const ghMatch = email.match(
      /^(?:\d+\+)?(.+)@users\.noreply\.github\.com$/
    );
    if (ghMatch) {
      mapping[email] = ghMatch[1];
      resolved++;
      continue;
    }

    if (email.endsWith("@users.noreply.github.com")) {
      continue;
    }

    // 2. Get a commit SHA for this email
    try {
      const sha = execSync(`git log --format="%H" --author="${email}" -1`, {
        encoding: "utf-8",
        cwd: getGitRootDir(),
      }).trim();
      if (sha) {
        emailsNeedingApi.push({ email, sha });
      }
    } catch {
      mapping[email] = null;
    }
  }

  // Resolve via GitHub Commits API
  for (const { email, sha } of emailsNeedingApi) {
    try {
      apiCalls++;
      const res = await fetch(
        `https://api.github.com/repos/${repo}/commits/${sha}`,
        { headers }
      );

      if (res.status === 403 || res.status === 429) {
        logger.warn(
          `Rate limited after ${apiCalls} API calls. Saving partial results.`
        );
        break;
      }

      if (res.ok) {
        const data = (await res.json()) as {
          author?: { login: string } | null;
        };
        if (data.author?.login) {
          mapping[email] = data.author.login;
          resolved++;
        } else {
          mapping[email] = null;
        }
      } else {
        mapping[email] = null;
      }

      if (apiCalls % 10 === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to resolve ${email}: ${message}`);
      mapping[email] = null;
    }
  }

  const total = Object.keys(mapping).length;
  const withGitHub = Object.values(mapping).filter(Boolean).length;
  logger.info(
    `${total} emails mapped (${withGitHub} resolved to GitHub, ${apiCalls} API calls)`
  );

  return mapping;
}

/**
 * Parse git log with rename detection to build per-file contributor lists.
 *
 * Uses `git log -M --name-status` which outputs rename entries (R100\told\tnew)
 * alongside regular modifications (M\tfile). We build a rename map (old→new)
 * and merge contributors from all previous names of each file into its current
 * path entry.
 *
 * Keys in the output are relative to the Astro project root (git prefix stripped).
 */
function buildPerFileContributors(
  mapping: Record<string, string | null>,
  isMatch: (path: string) => boolean,
  gitPrefix: string,
  logger: Logger
): Record<
  string,
  { username: string; avatarUrl: string; profileUrl: string }[]
> {
  let result: string;
  try {
    result = execSync('git log -M --name-status --format="----%aE"', {
      encoding: "utf-8",
      cwd: getGitRootDir(),
      maxBuffer: 100 * 1024 * 1024,
    });
  } catch {
    logger.warn("git not available — skipping per-file contributors");
    return {};
  }

  // Phase A: Parse git log to collect per-path emails and build rename map.
  // We parse commit-by-commit so we can detect D+A pairs (delete old extension,
  // add new extension) within the same commit as implicit renames.
  const pathEmails = new Map<string, Set<string>>(); // absolute git paths → emails
  const renameMap = new Map<string, string>(); // old path → new path

  function stripExtension(p: string): string {
    return p.replace(/\.[^/.]+$/, "");
  }

  function addEmail(path: string, email: string) {
    if (!pathEmails.has(path)) pathEmails.set(path, new Set());
    pathEmails.get(path)!.add(email);
  }

  // Split into commit blocks
  let currentEmail = "";
  let commitDeletes: string[] = [];
  let commitAdds: string[] = [];

  function flushCommit() {
    // Match D+A pairs where the path without extension is the same
    // (e.g. index.md deleted + index.mdx added = implicit rename)
    if (commitDeletes.length > 0 && commitAdds.length > 0) {
      const deletesByBase = new Map<string, string>();
      for (const d of commitDeletes) {
        deletesByBase.set(stripExtension(d), d);
      }
      const matchedDeletes = new Set<string>();
      for (const a of commitAdds) {
        const base = stripExtension(a);
        const matchedDelete = deletesByBase.get(base);
        if (matchedDelete && matchedDelete !== a) {
          // Implicit rename: old extension → new extension
          renameMap.set(matchedDelete, a);
          matchedDeletes.add(matchedDelete);
          addEmail(a, currentEmail);
        } else {
          // Regular add
          addEmail(a, currentEmail);
        }
      }
      // Remaining unmatched deletes are just deletes (no action needed)
    } else {
      for (const a of commitAdds) {
        addEmail(a, currentEmail);
      }
    }
    commitDeletes = [];
    commitAdds = [];
  }

  for (const line of result.split("\n")) {
    if (line.startsWith("----")) {
      flushCommit();
      currentEmail = line.slice(4).trim();
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || !currentEmail) continue;

    if (trimmed.startsWith("R")) {
      // Explicit rename detected by git: R100\told\tnew
      const parts = trimmed.split("\t");
      if (parts.length >= 3) {
        const oldPath = parts[1];
        const newPath = parts[2];
        renameMap.set(oldPath, newPath);
        addEmail(newPath, currentEmail);
      }
    } else if (trimmed.startsWith("D")) {
      const parts = trimmed.split("\t");
      if (parts.length >= 2) {
        commitDeletes.push(parts[1]);
      }
    } else if (trimmed.startsWith("A")) {
      const parts = trimmed.split("\t");
      if (parts.length >= 2) {
        commitAdds.push(parts[1]);
      }
    } else if (trimmed.startsWith("M")) {
      const parts = trimmed.split("\t");
      if (parts.length >= 2) {
        addEmail(parts[1], currentEmail);
      }
    }
  }
  flushCommit();

  // Phase B: Resolve rename chains (old → ... → current) and merge emails
  // Build forward chains: for each old path, find its final current path
  function resolveCurrentPath(path: string): string {
    const visited = new Set<string>();
    let current = path;
    while (renameMap.has(current) && !visited.has(current)) {
      visited.add(current);
      current = renameMap.get(current)!;
    }
    return current;
  }

  // Merge emails from old paths into their current (final) paths
  const mergedEmails = new Map<string, Set<string>>();

  for (const [path, emails] of pathEmails) {
    const currentPath = resolveCurrentPath(path);
    if (!mergedEmails.has(currentPath)) {
      mergedEmails.set(currentPath, new Set());
    }
    for (const email of emails) {
      mergedEmails.get(currentPath)!.add(email);
    }
  }

  // Phase C: Filter to included paths and resolve emails to GitHub contributors
  const output: Record<
    string,
    { username: string; avatarUrl: string; profileUrl: string }[]
  > = {};

  for (const [absPath, emails] of mergedEmails) {
    // Strip git prefix to get path relative to Astro project root
    if (gitPrefix && !absPath.startsWith(gitPrefix)) continue;
    const relPath = gitPrefix ? absPath.slice(gitPrefix.length) : absPath;

    if (!isMatch(relPath)) continue;

    const seen = new Set<string>();
    const contributors: {
      username: string;
      avatarUrl: string;
      profileUrl: string;
    }[] = [];

    for (const email of emails) {
      const username = mapping[email];
      if (!username || seen.has(username)) continue;
      seen.add(username);

      contributors.push({
        username,
        avatarUrl: `https://github.com/${username}.png?size=48`,
        profileUrl: `https://github.com/${username}`,
      });
    }

    if (contributors.length > 0) {
      output[relPath] = contributors;
    }
  }

  return output;
}

async function generateContributors(
  include: string[],
  repo: string,
  logger: Logger
) {
  const gitPrefix = getGitPrefix();
  const isMatch = picomatch(include);

  const mapping = await resolveEmails(repo, logger);
  const contributors = buildPerFileContributors(
    mapping,
    isMatch,
    gitPrefix,
    logger
  );

  mkdirSync(dataDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(contributors));

  const fileCount = Object.keys(contributors).length;
  const totalContribs = Object.values(contributors).reduce(
    (s, a) => s + a.length,
    0
  );
  logger.info(
    `contributors.json: ${fileCount} files, ${totalContribs} contributors`
  );
}
