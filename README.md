# docs.duendesoftware.com

## Getting Started

You will need Node 22+ installed on your operating system and in the PATH.

* Run `npm install` to restore all dependencies.
* Use `npm run dev` to run the documentation site locally.

Alternatively in VS Code, GitHub Codespaces, or WebStorm, you can use the devcontainer to get a development environment set up.

## Project Structure

This project uses Astro + Starlight. You'll see the following folders and files:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   ├── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

## ✍️ Authoring

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
* When linking other pages, use a path that starts at the content root, like `/identityserver/troubleshooting.md`. Use the `.md(x)` file extension - Starlight will update the link to the correct format on build.
* When linking to external resources, use the full URL using HTTPS.
* You can link to header anchors using the `#` symbol, for example `[multiple authentication methods](/identityserver/ui/federation.md#multiple-authentication-methods-for-users)`.
* Link relevant text. Prefer `learn more about [improving the sign-in experience]` over `click [here] to learn more`.
* Run `npm run linkchecker` to validate all links (note this will ignore links to GitHub because of rate limits in place).
* When a markdown link is long (75+ characters) or a link is repeated multiple times on a page, prefer moving the link to the bottom of the file and usings markdown anchor syntax `[test.cs][repo-test-file]`

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
* When referencing a property, field, class, or other symbol in text, use the `test` format instead of *test*.
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

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
|:--------------------------|:-------------------------------------------------|
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run linkchecker`     | Run lychee link checker                          |

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
edit the `astro.config.mjs` file and append a key/vaklue pair to the `redirects` property:

```json
redirects: {
  "/identityserver/product-page": "https://duendesoftware.com/products/identityserver",
},
```

This will remove the old page from the navigation structure, but keeps the URL around
with a redirect to the new location.
