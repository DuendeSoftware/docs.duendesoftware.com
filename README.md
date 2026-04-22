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

* Use the active voice. For example, use "Enable" instead of "Enabled" or "Enabling".
* Use the second person ("you" not "I" or "we"). "You" is the reader of the documentation. "We" is Duende Software.
* Use sentence case in text. Titles use Title Case.
* Use the Oxford comma.
* Avoid words like "very", "simple", "easy", ...
* "As well as" can be written as "and".
* Avoid flowery language.
* When using acronyms, use the full form with parentheses the first time you use it. For example, use "Multi-Factor Authentication (MFA)" instead of "MFA".

### Linking Rules

* Always prefer linking internally over linking externally. For example, when you talk about data protection, prefer an internal link over a link to external sites.
* When linking to external content, consider writing one or two sentences about the context and what the reader will learn on the linked page.
* When linking other pages, use a path that starts at the content root, like `/identityserver/troubleshooting/index.md`. Use the `.md(x)` file extension - Starlight will update the link to the correct format on build.
* When linking to external resources, use the full URL using HTTPS.
* You can link to header anchors using the `#` symbol, for example `[multiple authentication methods](/identityserver/ui/federation.md#multiple-authentication-methods-for-users)`.
* Link relevant text. Prefer `learn more about [improving the sign-in experience]` over `click [here] to learn more`.
* Run `dotnet build.cs link-check` to build Astro for link validation (actual lychee check runs in CI).
* When a markdown link is long (75+ characters) or a link is repeated multiple times on a page, prefer moving the link to the bottom of the file and using markdown anchor syntax `[test.cs][repo-test-file]`

### Markdown Style

* Use `*` for lists. Do not use `-`.
* Use `[link title](https://example.com)` for links, avoid reference-style links unless you need to repeat the same link multiple times.
* For internal links, always include the extension (e.g. `.md` or `.mdx`)
* Prefer `csharp` over `cs` to set the language for C# code blocks.

### Code Block Style

* Use triple backticks to enclose code blocks.
* Use a language identifier to specify the language (e.g. `csharp`, `bash`, `json`, `html`, `javascript`, `typescript`, `css`, `json`)
* Add a title to the code block. You can do this adding the title as a comment in the first line of the code block (e.g. `// Program.cs`).
* Use [expressive code features](https://starlight.astro.build/guides/authoring-content/#expressive-code-features).
* Readers should not need to scroll horizontally to read a code example. Simplify and condense the code as much as possible.
* If writing C#, use the latest syntax — including top-level statements, collection expressions, ...
* Make sure examples are runnable and complete. The goal is "Copy-paste from docs". Include namespaces, a result, and other prerequisites that are not obvious to someone new to the code.
* Inline comments can be used to explain essential parts of the code. Expressive code can highlight line numbers, show diffs, and more.
* Mention NuGet packages as a `bash` code block showing how to install it (`dotnet add package ...`). Link to the NuGet Gallery.
* When referencing a property, field, class, or other symbol in text, use the `test` format instead of _test_.
* Values should also be back-ticked, especially HTTP Status codes like `404` or `401`.
* Make sure code blocks start at the very first character space and don't have excessive starting padding.

### Frontmatter Rules

* Always have a `title` property to set the page title.
* Always have a `description` property to set the page description. This is a summary of the page's core content.
* Always have a `date` property to set the creation/significant update date for a page. Use the `YYYY-MM-DD` format.
* Add the `sidebar` property and must include the `label` and `order`. The `label` is used in the menu, and should typically be shorter than the more descriptive `title`. For example:

  ```yaml
  title: "Using IdentityServer As A Federation Gateway"
  sidebar:
    label: "Federation"
    order: 1
  ```

## 🧞 Commands

Astro commands are run from the `astro/` directory:

| Command | Action |
| :------ | :----- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build production site (use `dotnet build.cs astro-build` instead) |
| `npm run preview` | Preview your build locally |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro check` |

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

* **[`llms.txt`](https://docs.duendesoftware.com/llms.txt) and [`llms-full.txt`](https://docs.duendesoftware.com/llms-full.txt)** — Machine-readable site index and full content dump following the [llms.txt proposal](https://llmstxt.org/), so AI tools can discover and ingest our docs.
* **Content negotiation** — The server supports `Accept: text/markdown` to return raw Markdown for any docs page, giving AI agents clean content without HTML noise.
* **`robots.txt` signals** — We don't block AI crawlers. The robots.txt includes references to `llms.txt` so crawlers can find structured content.

Beyond this repo, Duende also provides tools that give AI coding assistants specialized knowledge (see [AI Agent Tools](https://docs.duendesoftware.com/general/ai-agent-tools/)):

* **[Agent Skills](https://github.com/DuendeSoftware/duende-skills)** — Structured `SKILL.md` files following the [Agent Skills format](https://agentskills.io/) that give AI assistants domain expertise on IdentityServer, BFF, token management, and more. Loaded automatically by compatible IDEs.
* **[MCP Server](https://github.com/DuendeSoftware/products/blob/main/docs-mcp/README.md)** — A local [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI assistants search and fetch access to the full Duende docs, blog, and sample code via SQLite full-text search.

### Why

Developers increasingly use AI assistants to find answers. If our docs aren't AI-friendly, those assistants hallucinate or point elsewhere. Making content machine-readable means Duende products get accurate representation in AI-generated answers.

## ⚖️ License

For all licensing information, refer to the relevant license files:

* [LICENSE](LICENSE) - License for the documentation site content.
* [LICENSE-CODE](LICENSE-CODE) - License for the code samples.

The Astro documentation engine is licensed under the [MIT license](https://github.com/withastro/astro/blob/main/LICENSE).
