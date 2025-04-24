import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";

interface Element extends Parent {
  type: "element";
  tagName: string;
  properties: {
    [key: string]: unknown;
  };
  content: Node;
  children: Node[];
}

export default function removeMarkdownExtensions(): (tree: Node) => void {
  return (tree: Node) => {
    visit(tree, "element", (node: Element) => {
      if (
        node.tagName === "a" &&
        node.properties &&
        typeof node.properties.href === "string"
      ) {
        const markdownExtensionRegex = /\.md(#.*)?$/;
        if (markdownExtensionRegex.test(node.properties.href)) {
          let date = new Date().toLocaleTimeString("en-US", { hour12: false });
          console.log(
            `\x1b[90m${date}\x1b[0m \x1b[95m[🔥 *.md]\x1b[0m ${node.properties.href}`,
          );

          node.properties.href = node.properties.href.replace(
            markdownExtensionRegex,
            "$1",
          );
        }
      }
    });
  };
}
