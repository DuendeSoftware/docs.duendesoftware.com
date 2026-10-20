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

* Prefer internal links over external links.
* Markdown internal links must start at the content root (e.g. `/identityserver/troubleshooting/index.md`).
* External links must use HTTPS.
* Link relevant text: prefer `learn more about [improving sign-in]` over `click [here]`.
* Long links (75+ chars) or repeated links should use markdown anchor syntax at the bottom of the file.
* When linking externally, include a sentence about what the reader will find.

## Markdown Style

* Use `*` for unordered lists, not `-`.
* Use inline links `[text](url)` unless repeated or very long.
* Markdown internal links must include the file extension (`.md` or `.mdx`). Some Starlight components (for example, `LinkCard`) use route-style links instead.

## Code Blocks

* Use triple backticks with a language identifier. Prefer `csharp` over `cs`.
* Add a title comment on the first line (e.g. `// Program.cs`).
* Keep code concise, without horizontal scrolling. Start at column 0 unless nested in a list or component.
* C# should use the latest syntax (top-level statements, collection expressions).
* Examples should be complete and copy-paste runnable.
* Use backticks for inline properties, classes, symbols, and values (including status codes like `404`).
* Mention NuGet packages with `dotnet add package ...` in a `bash` block and link to the NuGet Gallery.

### Badges and Versions

* Flag manual version badges (`<Badge text="v8.0" />`, `<span data-shb-badge>`, `:badge[v8.0]`). Use `versions` frontmatter (quoted "major.minor", e.g. `"8.0"`) or folder `_meta.yml` for pages, and `<Version since="8.0">` (`import Version from "~/components/Version.astro"`) for sections. Literal values only; `until` is exclusive.
* `since`/`until` must be declared in `products` (astro.config.mjs). Preview pages need `preview: true`.
* For non-version labels such as target frameworks (TFMs):
  * In .mdx, import and use `Badge`: `<Badge text="Optional" />`.
  * In .md, use `<span data-shb-badge data-shb-badge-variant="default">Optional</span>`.
  * In headings, use the "starlight-heading-badges" shorthand: `### Title :badge[.NET 10]`. Works in Markdown and MDX, and can be used multiple times.

## Redirects

* `.mdx`: use the `Badge` component, e.g. `<Badge text="v8.0" />`.
* `.md`: use `<span data-shb-badge data-shb-badge-variant="default">v8.0</span>`.
* Headings (both): `### SAML Events :badge[v8.0]`.
