# docs.duendesoftware.com

---
## Private branch notice

This respository is a private clone of Duende docs.duendesoftware.com repository (it is not a GitHub fork).

- Use this repository when you want to **privately** collaborate and align on changes prior to applying them to the public repository.
- The default branch is `main`.
- There is a branch `upstream-main` which may be updated from the upstream `main` branch manually.
- There are no branch rulesets or other restrictions applied.
---

## Getting Started

You will need Node 22+ installed on your operating system and in the PATH.

* Run `npm install` to restore all dependencies.
* Use `npm run dev` to run the documentation site locally.

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
