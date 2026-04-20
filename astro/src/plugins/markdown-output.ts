import url from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import type { AstroIntegrationLogger } from "astro";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import { JSDOM } from "jsdom";
import { toText } from "hast-util-to-text";

/**
 * Astro integration that generates a Markdown file (index.md) next to every
 * rendered HTML file (index.html) in the build output.
 *
 * The Markdown is derived from the rendered HTML, so all links, includes,
 * components, etc. are already resolved.
 */
export default function markdownOutput() {
  return {
    name: "markdown-output",
    hooks: {
      "astro:build:done": async ({
        dir,
        pages,
        logger,
      }: {
        dir: URL;
        pages: Array<{ pathname: string }>;
        logger: AstroIntegrationLogger;
      }) => {
        const outDir = url.fileURLToPath(dir);
        const processor = unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeRemark, {
            handlers: {
              // Preserve language hints on code fences from <pre data-language="...">
              pre(state: any, node: any) {
                const lang =
                  node.properties?.dataLanguage || "";
                const value = toText(node);
                const result = {
                  type: "code" as const,
                  lang: lang || null,
                  meta: null,
                  value: value.replace(/\n$/, ""),
                };
                state.patch(node, result);
                return result;
              },
              // Handle <figure> with code blocks: extract title from figcaption
              figure(state: any, node: any) {
                // Find figcaption title
                const figcaption = node.children?.find(
                  (c: any) => c.tagName === "figcaption",
                );
                const titleSpan = figcaption?.children?.find(
                  (c: any) =>
                    c.properties?.className?.includes("title"),
                );
                const title = titleSpan ? toText(titleSpan).trim() : "";

                // Find <pre> child
                const pre = node.children?.find(
                  (c: any) => c.tagName === "pre",
                );
                if (!pre) {
                  // Not a code figure, fall back to default
                  return state.all(node);
                }

                const lang = pre.properties?.dataLanguage || "";
                const value = toText(pre);
                const codeNode = {
                  type: "code" as const,
                  lang: lang || null,
                  meta: null,
                  value: value.replace(/\n$/, ""),
                };
                state.patch(pre, codeNode);

                if (title) {
                  const titleNode = {
                    type: "paragraph" as const,
                    children: [
                      {
                        type: "inlineCode" as const,
                        value: title,
                      },
                      {
                        type: "text" as const,
                        value: ":",
                      },
                    ],
                  };
                  return [titleNode, codeNode];
                }

                return codeNode;
              },
            },
          })
          .use(remarkGfm)
          .use(remarkStringify, {
            bullet: "-",
            emphasis: "*",
            strong: "*",
            rule: "-",
          });

        let count = 0;
        let errors = 0;

        await Promise.all(
          pages.map(async ({ pathname }) => {
            const htmlPath = path.join(outDir, pathname, "index.html");
            const mdPath = path.join(outDir, pathname, "index.md");

            try {
              const html = await fs.readFile(htmlPath, "utf-8");
              const dom = new JSDOM(html);
              const doc = dom.window.document;

              const main = doc.querySelector("main");
              if (!main) return;

              // Remove banner
              main.querySelectorAll(".sl-banner").forEach((el) => el.remove());

              // Remove "Section titled" anchor links in headings
              main.querySelectorAll("a").forEach((el) => {
                if (el.textContent?.trim().startsWith("Section titled")) el.remove();
              });

              // Remove "Edit page" link and "Last updated" meta section
              main.querySelectorAll("footer .meta").forEach((el) => el.remove());

              // Remove giscus comments
              main.querySelectorAll("giscus-comments").forEach((el) => el.remove());

              // Remove copyright footer (the <hr> + copyright div)
              main.querySelectorAll("footer > hr").forEach((el) => el.remove());
              main.querySelectorAll("footer > div:not(.pagination-links)").forEach((el) => el.remove());

              // Flatten pagination links so Previous/Next text is on one line
              // Structure: <a> <svg/> <span> Previous <br> <span class="link-title">Title</span> </span> </a>
              main.querySelectorAll(".pagination-links a").forEach((a) => {
                a.querySelectorAll("svg").forEach((svg) => svg.remove());
                a.querySelectorAll("br").forEach((br) => br.remove());
                const label = a.querySelector("span")?.childNodes[0]?.textContent?.trim(); // "Previous" or "Next"
                const title = a.querySelector(".link-title")?.textContent?.trim();
                if (label && title) {
                  a.textContent = `${label}: ${title}`;
                }
              });

              const content = main.innerHTML;
              const result = await processor.process(content);

              // Add page title as YAML frontmatter
              const pageTitle = doc.querySelector("title")?.textContent?.trim() || "";
              const frontmatter = `---\ntitle: ${pageTitle}\n---\n\n`;

              await fs.writeFile(mdPath, frontmatter + String(result));
              count++;
            } catch (e: any) {
              if (e.code === "ENOENT") {
                // No index.html for this page (e.g. redirects, API routes)
                return;
              }
              errors++;
              logger.warn(`Failed to generate Markdown for ${pathname}: ${e.message}`);
            }
          }),
        );

        logger.info(
          `Generated ${count} Markdown files${errors > 0 ? ` (${errors} errors)` : ""}`,
        );
      },
    },
  };
}
