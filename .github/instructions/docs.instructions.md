---
applyTo: "astro/src/content/**/*.{md,mdx}"
---

# Documentation Review Guidelines

## Purpose

Review documentation for Duende Software products (IdentityServer, BFF, etc.). Focus on writing quality, accuracy, and consistency with the project's authoring standards.

## Writing Style

- Tone: friendly, educational, patient — "a senior engineer sitting next to you helping with your homework."
- Use active voice. "Enable" not "Enabled" or "Enabling".
- Use second person: "you" is the reader, "we" is Duende Software.
- Sentence case in body text. Title Case for titles.
- Use the Oxford comma.
- Avoid filler words: "very", "simple", "easy", "just".
- Prefer plain words: "use" not "utilize", "set up" not "facilitate", "help" not "assist", "about" not "regarding".
- Keep it concise. Don't pad. Longer isn't better.
- Explain *why* something works, not just *what* to change.
- Expand acronyms on first use: "Multi-Factor Authentication (MFA)".
- If it sounds like a robot wrote it, flag it.

## Frontmatter

- Must have `title`, `description`, and `date` (YYYY-MM-DD format).
- May have `sidebar` with `label` and `order`. For long `title`, the `label` is used as a shorter entry in the navigation bar, and should be shorter than `title`.

## Linking Rules

- Prefer internal links over external links.
- Internal links must start at the content root (e.g. `/identityserver/troubleshooting/index.md`) and include the `.md` or `.mdx` extension.
- External links must use HTTPS.
- Link relevant text: prefer `learn more about [improving sign-in]` over `click [here]`.
- Long links (75+ chars) or repeated links should use markdown anchor syntax at the bottom of the file.
- When linking externally, include a sentence about what the reader will find.

## Markdown Style

- Use `*` for unordered lists, not `-`.
- Use inline links `[text](url)` unless the link is repeated or very long.
- Internal links must include the file extension (`.md` or `.mdx`).

## Code Blocks

- Use triple backticks with a language identifier (`csharp`, `bash`, `json`, `html`, `javascript`, `typescript`, `css`).
- Prefer `csharp` over `cs` for C#.
- Add a title as a comment in the first line (e.g. `// Program.cs`).
- Code should not require horizontal scrolling — keep it concise.
- C# examples should use latest syntax (top-level statements, collection expressions).
- Examples should be runnable and complete — "copy-paste from docs" is the goal.
- Use backticks for inline references to properties, classes, symbols, and values (including HTTP status codes like `404`).
- Code blocks must start at column 0 with no excessive leading whitespace.
- Mention NuGet packages with `dotnet add package ...` in a `bash` block and link to the NuGet Gallery.

## Redirects

- When a page is moved, check that `redirect_from` frontmatter is present with the old path.
