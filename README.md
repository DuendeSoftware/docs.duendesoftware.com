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

### Linking Rules

* Always prefer linking internally over linking externally. For example, when you talk about data protection, prefer an internal link over a link to external sites.
* When linking to external content, consider writing one or two sentences about the context and what the reader will learn on the linked page.
* When linking other pages, use a path that starts at the content root, like `/identityserver/troubleshooting.md`. Use the `.md(x)` file extension - Starlight will update the link to the correct format on build.
* When linking to external resources, use the full URL using HTTPS.
* You can link to header anchors using the `#` symbol, for example `[multiple authentication methods](/identityserver/ui/federation.md#multiple-authentication-methods-for-users)`.
* Link relevant text. Prefer `learn more about [improving the sign-in experience]` over `click [here] to learn more`.
* Run `npm run linkchecker` to validate all links (note this will ignore links to GitHub because of rate limits in place).

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
