/**
 * Adds a `product` attribute to every <Version> element, derived from the
 * source file path (content/docs/<product>/...). This makes <Version> work
 * outside a Starlight page render (e.g. the llms.txt exports).
 */
export default function remarkVersionProduct() {
  return (tree: any, file: any) => {
    const m = /content\/docs\/([^/]+)\//.exec((file?.path ?? "").replace(/\\/g, "/"));
    if (!m) return;
    const visit = (node: any) => {
      if (node.type === "mdxJsxFlowElement" && node.name === "Version") {
        node.attributes = (node.attributes ?? []).filter((a: any) => a.name !== "product");
        node.attributes.push({ type: "mdxJsxAttribute", name: "product", value: m[1] });
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
