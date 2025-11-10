import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";
import type { Plugin } from "unified";

interface Element extends Parent {
  type: "link";
  url: string;
  children: Node[];
}

interface RemoveMarkdownExtensionsOptions {
  ignoreRelativeLinks?: boolean;
}

const match = /(?:\/index)?\.(md|mdx)(#.*)?$/;

const removeMarkdownExtensions: Plugin = function ({
  ignoreRelativeLinks = false,
}: RemoveMarkdownExtensionsOptions = {}) {
  return (tree: Node) => {
    visit(tree, "link", (node: Element) => {
      // ignore relative links if configured
      if (
        ignoreRelativeLinks &&
        (node.url.startsWith("./") || node.url.startsWith("../"))
      ) {
        return;
      }

      if (match.test(node.url)) {
        let date = new Date().toLocaleTimeString("en-US", { hour12: false });

        console.log(
          `\x1b[90m${date}\x1b[0m \x1b[95m[🔥 *.md(x)]\x1b[0m ${node.url}`,
        );

        node.url = node.url.replace(match, "$2");

        // Add trailing slash
        if (!node.url.endsWith("/") && !node.url.includes("#")) {
          node.url += "/";
        } else if (node.url.includes("#") && !node.url.includes("/#")) {
          node.url = node.url.replace("#", "/#");
        }
      }
    });
  };
};

export default removeMarkdownExtensions;
