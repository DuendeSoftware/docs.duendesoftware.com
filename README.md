# docs.duendesoftware.com

Welcome to the documentation of all [Duende Software](https://duendesoftware.com) products and open-source tools!

## Getting Started

You will need the following installed:
* [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
* Node.js 24+

### Quick Start (Astro only)

```bash
cd astro
npm install
npm run dev
```

### Development with .NET Aspire

For local development with the full stack (Astro dev server + ASP.NET Core):

```bash
dotnet build.cs aspire
```

This starts:
* **Astro dev server** at http://localhost:4321 (with hot reload)
* **ASP.NET Core server** (for production-like static file serving)
* **Aspire Dashboard** at https://localhost:17001 (for traces, logs, metrics)

Alternatively in VS Code, GitHub Codespaces, or WebStorm, you can use the devcontainer to get a development environment set up.

## Build Commands

All commands use the `build.cs` file-based build script and can be run from any directory in the repository:

| Command | Action |
| :------ | :----- |
| `dotnet build.cs` | Build everything (Astro + .NET) |
| `dotnet build.cs astro-build` | Build Astro to wwwroot |
| `dotnet build.cs dotnet-build` | Build .NET solution |
| `dotnet build.cs container` | Build container image |
| `dotnet build.cs aspire` | Start Aspire dev environment |
| `dotnet build.cs clean` | Clean all build outputs |
| `dotnet build.cs verify-formatting` | Check .NET code formatting |
| `dotnet build.cs --list-targets` | List all available targets |

## Container

The container is built using `dotnet publish /t:PublishContainer` (no Dockerfile required).

### Building the container

```bash
dotnet build.cs container
```

### Running the container

```bash
docker run -p 8080:8080 docs
```

The site will be available at http://localhost:8080.

## Project Structure

This project uses Astro + Starlight for the documentation site, served by ASP.NET Core in production.

```
.
├── build.cs                  # File-based build script
├── astro/                    # Astro documentation site
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── content/
│   │   │   └── docs/
│   │   └── content.config.ts
│   ├── astro.config.mjs
│   ├── package.json
│   └── tsconfig.json
└── server/                   # ASP.NET Core server
    ├── src/
    │   ├── Docs.Web/             # Static file server
    │   │   └── wwwroot/          # Astro build output (gitignored)
    │   ├── Docs.AppHost/         # .NET Aspire orchestrator
    │   └── Docs.ServiceDefaults/ # Shared configuration
    └── tests/
        └── Docs.Web.Tests/       # Integration tests
```

Starlight looks for `.md` or `.mdx` files in the `astro/src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `astro/src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `astro/public/` directory.

## ✍️ Authoring

The `astro/` folder has been configured as a VS Code and WebStorm project, which you can open from that location to work on content.

Content can be authored in Markdown, in a `.md` or `.mdx` file. The Starlight documentation has some guidance on Markdown syntax, components, and more:

* [Authoring Content in Markdown](https://starlight.astro.build/guides/authoring-content/)
* [Using Components](https://starlight.astro.build/components/using-components/) (only in `.mdx`)

Use a spell checker like [Grazie](https://www.jetbrains.com/grazie/) or [Grammarly](https://www.grammarly.com/) to check your content for spelling and grammar errors.
WebStorm has Grazie as a built-in spell checker and grammar checker, and supports a good default writing style.

### Writing Style

* General style: "big brother sitting next to you helping with your homework." Friendly, educational, patient. You're a senior engineer who has seen this before and wants to help the reader understand, not just find a quick fix.
* Use the active voice. For example, use "Enable" instead of "Enabled" or "Enabling".
* Use the second person ("you" not "I" or "we"). "You" is the reader of the documentation. "We" is Duende Software.
* Page titles and headings use Title Case. Keep a, an, the, and, or, but, as, at, by, for, in, of, on, to, vs, via, and with lowercase unless they are the first or last word. Keep acronyms and product names as written. Body text uses sentence case.
* Use the Oxford comma.
* Avoid words like "very", "simple", "easy", ...
* "As well as" can be written as "and".
* Use plain words: "use" not "utilize", "set up" not "facilitate", "help" not "assist", "about" not "regarding", ... (unless technically precise).
* Avoid flowery language. Keep it concise. Answer thoroughly, but don't pad. Longer isn't better.
* Educational, not pedantic: Explain *why* something works, not just *what* to change. Don't over-explain things that are likely already known. When in doubt, include some basic info and reference relevant other sources with more background.
* When using acronyms, use the full form with parentheses the first time you use it. For example, use "Multi-Factor Authentication (MFA)" instead of "MFA".
* No em dashes.
* Avoid semicolons unless you need one. Write two sentences instead.
* Avoid AI-isms: "delve", "robust", "seamless", "leverage", "crucial", "ensure" (use "make sure"), "navigate", "landscape", "journey", "unlock", "empower", "comprehensive", "straightforward", "it is worth noting", "in order to" (use "to"), exclamation marks, and emoji.
* Vary sentence length. Mix short and long sentences.
* Define a term the first time you use it.
* Read it out loud. If it sounds like a robot wrote it, rewrite it.

### Linking Rules

* Always prefer linking internally over linking externally. For example, when you talk about data protection, prefer an internal link over a link to external sites.
* When linking to external content, consider writing one or two sentences about the context and what the reader will learn on the linked page.
* When writing markdown links to other pages, use a path that starts at the content root, like `/identityserver/troubleshooting/index.md`, and include the `.md` or `.mdx` extension. Some Starlight components (for example, `LinkCard`) use route-style links instead, so follow the component's expected link format.
* When linking to external resources, use the full URL using HTTPS.
* You can link to header anchors using the `#` symbol, for example `[multiple authentication methods](/identityserver/ui/federation.md#multiple-authentication-methods-for-users)`.
* Link relevant text. Prefer `learn more about [improving the sign-in experience]` over `click [here] to learn more`.
* Run `dotnet build.cs link-check` to build Astro for link validation (actual lychee check runs in CI).
* When a markdown link is long (75+ characters) or a link is repeated multiple times on a page, prefer moving the link to the bottom of the file and using markdown anchor syntax `[test.cs][repo-test-file]`

### Markdown Style

* Use `*` for lists. Do not use `-`.
* Use `[link title](https://example.com)` for links, avoid reference-style links unless you need to repeat the same link multiple times.
* For internal links, always include the extension (e.g. `.md` or `.mdx`)

### Code Block Style

* Use triple backticks with an appropriate language identifier. Common identifiers used in this repo include `csharp`, `bash`, `powershell`, `shell`, `sh`, `json`, `html`, `javascript`, `typescript`, `css`, `razor`, `xml`, `sql`, `sqlite`, `txt`, `diff`, and `mermaid`.
* Prefer `csharp` over `cs` to set the language for C# code blocks.
* Add a title to the code block. You can do this adding the title as a comment in the first line of the code block (e.g. `// Program.cs`).
* Use [expressive code features](https://starlight.astro.build/guides/authoring-content/#expressive-code-features).
* Readers should not need to scroll horizontally to read a code example. Simplify and condense the code as much as possible.
* If writing C#, use the latest syntax, including top-level statements, collection expressions, ...
* Make sure examples are runnable and complete. The goal is "Copy-paste from docs". Include namespaces, a result, and other prerequisites that are not obvious to someone new to the code.
* Inline comments can be used to explain essential parts of the code. Expressive code can highlight line numbers, show diffs, and more.
* Mention NuGet packages as a `bash` code block showing how to install it (`dotnet add package ...`). Link to the NuGet Gallery.
* When referencing a property, field, class, or other symbol in text, use the `test` format instead of _test_.
* Values should also be back-ticked, especially HTTP Status codes like `404` or `401`.
* Avoid excessive indentation in code blocks; use column 0 unless indentation is needed to nest under lists or MDX components.

### Badges

* Do not use badges for version-specific content. Use the `versions` frontmatter or the `<Version>` component instead; see [Versioning content](#versioning-content).
* Use badges only for non-version labels:
  * In .mdx pages, import and use the `Badge` component. For example: `<Badge text="Optional" />`.
  * In .md pages, use the `<span data-shb-badge>` HTML element. For example: `<span data-shb-badge data-shb-badge-variant="default">Optional</span>`.
  * Headers can also include badges via the "starlight-heading-badges" shorthand, in both Markdown and MDX. For example, `### Title :badge[.NET 10]`. The `:badge` syntax can be used multiple times in a header.

### Frontmatter Rules

* Always have a `title` property to set the page title.
* Always have a `description` property to set the page description. This is a summary of the page's core content.
* Always have a `date` property to set the creation/significant update date for a page. Use the `YYYY-MM-DD` format. This includes the pages under `astro/src/content/docs/protocols/`: update it when you change a page in a way readers would notice.
* Add the `sidebar` property and include the `label` and `order` (optional on `/protocols/` pages when the title already fits the menu). The `label` is used in the menu, and should typically be shorter than the more descriptive `title`. For example:

  ```yaml
  title: "Using IdentityServer As A Federation Gateway"
  sidebar:
    label: "Federation"
    order: 1
  ```

### Protocols: Identity Visualized

* Pages live in `astro/src/content/docs/protocols/<group>/<slug>.mdx`. A group is a folder with a `_meta.yml` for its label and order. The sidebar autogenerates.
* Frontmatter has `title`, `date`, `description`, `sources` (spec registry keys), and `flow`. The `flow` has `actors` (each with `name` and `role`) and `steps` (each with `from`, `to`, `channel`, `title`, `summary`, and `holds`). An entry in `holds` that starts with `-` removes that item, for example when a token is replaced.
* Limits: max 3 actors, max 7 steps, step title max 8 words, step summary max 35 words. The `### N.` headings in the body equal the step titles.
* Body H2s, in order: Why It Exists, How It Works (`<Flow flow={frontmatter.flow} />`), Step by Step, Notes, Use It When, Don't Confuse With, Build with Duende, and Sources (`<Sources keys={frontmatter.sources} />`).
* Cite specs with `<Cite k="..." />`. Keys come from the spec registry in `astro/src/content/specs/*.yaml`.
* To embed a flow in another docs page, import `Flow` from `~/components/Flow.astro` and use `<Flow page="<group>/<slug>" />`. Use at most 2 per page.
* `npm run protocols:check` is a dry run of the spec watcher: an offline drift check plus a live spec comparison. It never opens issues.
* `npm run protocols:monthly` is what the GitHub Action `protocols-monthly.yml` runs. Its schedule is disabled for now. Run it manually with the `dry_run` input.
* New pages need review of the spec accuracy by a second person against the spec.

## 🧞 Commands

Astro commands are run from the `astro/` directory:

| Command | Action |
| :------ | :----- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build production site (use `dotnet build.cs astro-build` instead) |
| `npm run preview` | Preview your build locally |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro check` |

## Versioning content

Version-specific content is declared, not hand-badged. Use quoted `"major.minor"` values; `since` is inclusive, `until` is **exclusive**.

* **Pages and folders**: add a `versions` block to page frontmatter or a folder's `_meta.yml`. Pages inherit the folder's value unless they set their own.

  ```yaml
  versions:
    since: "8.0"
    until: "9.0"
  ```

* **Sections**: wrap a heading and its content in `<Version>`. Use literal values only. The full label (e.g. "IdentityServer 8.0 and later") always stays in the page text (visually hidden) for exports, agents and screen readers. Blocks with only `since` get a quiet "Added in 8.0" tag after the section heading, a small "8.0+" tag after each top-level list item, or a muted caption above other content; blocks with `until` show nothing visible.

  ```mdx
  import Version from "~/components/Version.astro";

  <Version since="8.0">
  ## SAML Events
  Content for 8.0 and later.
  </Version>
  ```

* **Cards**: wrap a `LinkCard`/`Card` in `<Version since="8.1" inline>` to hide it (never shows a caption or badge) when its target page does not apply to the selected version; the label stays as screen-reader/export text. Only use it for targets within the same product. A `inline` wrapper also works around a whole list of links (including its lead-in sentence).

* **Unsupported versions**: set `unsupported: true` on a declared version (e.g. `{ version: "6.3", unsupported: true }`) to show "(unsupported)" in the dropdown and a notice on every page while it is selected. It cannot be combined with `preview: true` (the build fails). A product may also set an `upgrades` URL (e.g. `/identityserver/upgrades/`), which adds an upgrade guide link to the notice. Use sparingly.

* **Preview pages**: set `preview: true` in frontmatter for an automatic sidebar badge and preview banner.

Each product declares its versions (newest first) in `products` in `astro/astro.config.mjs`, e.g. `{ version: "8.1", preview: true }`, `{ version: "8.0" }`. The latest stable version is the first non-preview entry. Every `since`/`until` must be a declared version or the build fails. Declared versions with no content are still selectable. Pages whose `since` is a preview version automatically get the preview badge and banner; remove `preview: true` from the version entry when it ships (the page-level `preview: true` flag remains for pages not tied to a version). `general/`, release notes, and upgrade guides are never filtered.

The version chip lists the declared versions and preselects the latest stable one. That default view also shows preview content and hides only content valid solely for older versions (`until` at or before the latest stable). Pick an older version (or the preview) for strict filtering. The `new` sidebar badge shows only in the default view.

## 🔀 Redirects

There are two ways to restructure content:

* Internal (move content around in the current structure)
* External (move content outside the current structure)

### Internal Restructuring

When doing internal restructuring, move the page to its new location and then update its frontmatter
to include the old location:

```yaml
---
title: Page title
redirect_from:
  - /old-path-to/content
---
Page content goes here
```

This will generate the page at the new location, and put a redirect to it at the old location.

### External Restructuring

When moving a page outside the structure, or you need a redirect to another location altogether,
edit the `astro/astro.config.mjs` file and append a key/value pair to the `redirects` property:

```json
redirects: {
  "/identityserver/product-page": "https://duendesoftware.com/products/identityserver",
},
```

This will remove the old page from the navigation structure, but keeps the URL around
with a redirect to the new location.

## 🤖 AI-Friendly Documentation

We make our docs consumable by AI agents and LLMs, not just humans.

### What we do

* **[`llms.txt`](https://docs.duendesoftware.com/llms.txt) and [`llms-full.txt`](https://docs.duendesoftware.com/llms-full.txt)**: Machine-readable site index and full content dump following the [llms.txt proposal](https://llmstxt.org/), so AI tools can discover and ingest our docs.
* **Content negotiation**: The server supports `Accept: text/markdown` to return raw Markdown for any docs page, giving AI agents clean content without HTML noise.
* **`robots.txt` signals**: We don't block AI crawlers. The robots.txt includes references to `llms.txt` so crawlers can find structured content.

Beyond this repo, Duende also provides tools that give AI coding assistants specialized knowledge (see [AI Agent Tools](https://docs.duendesoftware.com/general/ai-agent-tools/)):

* **[Agent Skills](https://github.com/DuendeSoftware/duende-skills)**: Structured `SKILL.md` files following the [Agent Skills format](https://agentskills.io/) that give AI assistants domain expertise on IdentityServer, BFF, token management, and more. Loaded automatically by compatible IDEs.
* **[MCP Server](https://github.com/DuendeSoftware/products/blob/main/docs-mcp/README.md)**: A local [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI assistants search and fetch access to the full Duende docs, blog, and sample code via SQLite full-text search.

### Why

Developers increasingly use AI assistants to find answers. If our docs aren't AI-friendly, those assistants hallucinate or point elsewhere. Making content machine-readable means Duende products get accurate representation in AI-generated answers.

## ⚖️ License

For all licensing information, refer to the relevant license files:

* [LICENSE](LICENSE) - License for the documentation site content.
* [LICENSE-CODE](LICENSE-CODE) - License for the code samples.

The Astro documentation engine is licensed under the [MIT license](https://github.com/withastro/astro/blob/main/LICENSE).
