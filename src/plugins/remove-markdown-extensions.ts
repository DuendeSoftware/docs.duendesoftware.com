import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";
import type { Plugin } from "unified";

interface Element extends Parent {
  type: "link";
  url: string;
  children: Node[];
}

const removeMarkdownExtensions: Plugin = function () {
  return (tree: Node) => {
    visit(tree, "link", (node: Element) => {
      const match = /(?:\/index)?\.(md|mdx)(#.*)?$/;
      if (match.test(node.url)) {
        let date = new Date().toLocaleTimeString("en-US", { hour12: false });

        console.log(
          `\x1b[90m${date}\x1b[0m \x1b[95m[🔥 *.md(x)]\x1b[0m ${node.url}`,
        );

        node.url = node.url.replace(match, "$2");
      }
    });
  };
};

export default removeMarkdownExtensions;
