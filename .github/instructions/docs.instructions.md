---
applyTo: "astro/src/content/**/*.{md,mdx}"
---

# Documentation Review Guidelines

Review Duende Software product docs (IdentityServer, BFF, etc.) for writing quality, accuracy, and consistency.

## Writing Style

* Tone: friendly, educational, patient. Like a senior engineer sitting next to you helping with your homework.
* Use active voice, second person ("you" is the reader, "we" is Duende Software).
* Sentence case in body text. Title Case for titles. Use the Oxford comma.
* Avoid filler words: "very", "simple", "easy", "just".
* Prefer plain words: "use" not "utilize", "help" not "assist", "about" not "regarding".
* Avoid emdashes (`—`). Usually, split into two sentences. Use a comma, colon, or parentheses only when that reads better. Don't swap the emdash for `;` by default.
* Expand acronyms on first use: "Multi-Factor Authentication (MFA)".
* If it sounds like a robot wrote it, flag it.

## Context

* Readers must get enough context to understand the topic without searching elsewhere. Flag content that assumes knowledge it never provides.
* If a spec or RFC defines the topic, add one sentence saying so, with a link.
* If one sentence of background on *why* something exists or matters would help, add it.
* Explain *why* something works, not just *what* to change.
* Keep it as short as possible, and as long as needed. Don't pad.

## Frontmatter

* Must have `title`, `description`, and `date`. Prefer `YYYY-MM-DD`, but accept other formats already used in this repo (such as ISO 8601 timestamps).
* Optional `sidebar.label` should be shorter than `title`.
* When a page is moved, `redirect_from` must list the old path.

## Linking Rules

* Prefer internal links. Markdown internal links start at the content root and include the `.md`/`.mdx` extension (e.g. `/identityserver/troubleshooting/index.md`). Components like `LinkCard` use route-style links.
* External links must use HTTPS. Add a sentence about what the reader will find there.
* Link relevant text (`learn more about [improving sign-in]`), never "click [here]".
* Use reference-style links at the bottom of the file for long (75+ chars) or repeated links.

## Markdown Style

* Use `*` for unordered lists, not `-`.

## Code Blocks

* Use triple backticks with a language identifier. Prefer `csharp` over `cs`.
* Add a title comment on the first line (e.g. `// Program.cs`).
* Keep code concise, without horizontal scrolling. Start at column 0 unless nested in a list or component.
* C# should use the latest syntax (top-level statements, collection expressions).
* Examples should be complete and copy-paste runnable.
* Use backticks for inline properties, classes, symbols, and values (including status codes like `404`).
* Mention NuGet packages with `dotnet add package ...` in a `bash` block and link to the NuGet Gallery.

## Badges and Versions

* Flag manual version badges (`<Badge text="v8.0" />`, `<span data-shb-badge>`, `:badge[v8.0]`) used for version info.
* Version pages with `versions` frontmatter (quoted "major.minor", e.g. `"8.0"`) or folder `_meta.yml`. Wrap version-specific sections in `<Version since="8.0">` (`import Version from "~/components/Version.astro"`) with literal values. `until` is exclusive.
* `since`/`until` must be a version declared in `products` (`astro/astro.config.mjs`). Preview pages need `preview: true`.
* Non-version badges (license tier, .NET 10) are fine:
  * `.mdx`: `<Badge text="Optional" />`.
  * `.md`: `<span data-shb-badge data-shb-badge-variant="default">Optional</span>`.
  * Headings (both): `### Title :badge[.NET 10]`.
