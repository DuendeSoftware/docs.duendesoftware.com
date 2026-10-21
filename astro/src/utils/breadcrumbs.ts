import { getCollection } from "astro:content";
import { products } from "virtual:dv-products";

export type Crumb = { text: string; href?: string };
export type SidebarEntry =
  | { type: "link"; href: string }
  | { type: "group"; label: string; entries: SidebarEntry[] };

const firstLink = (entries: SidebarEntry[]): string | undefined => {
  for (const entry of entries) {
    const href = entry.type === "link" ? entry.href : firstLink(entry.entries);
    if (href) return href;
  }
};

/** Follows the folder labels down the sidebar and returns the folder's first link, as the sidebar orders it. */
function firstChildHref(sidebar: SidebarEntry[], folderLabels: string[]): string | undefined {
  let entries = sidebar;
  for (const label of folderLabels) {
    const group = entries.find((e) => e.type === "group" && e.label === label);
    if (group?.type !== "group") return undefined;
    entries = group.entries;
  }
  return firstLink(entries);
}

const GENERAL_LABEL = "General Information";
const topicLabels = new Map([["general", GENERAL_LABEL], ...products.map((p) => [p.key, p.label] as const)]);

const dirOfFile = (path: string) =>
  path.replace(/^.*content\/docs\//, "").split("/").slice(0, -1).join("/");

const titleCase = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

let lookup: Promise<{ folderLabels: Map<string, string>; indexPages: Map<string, string> }> | undefined;
const getLookup = () =>
  (lookup ??= (async () => {
    const [meta, docs] = await Promise.all([getCollection("autoSidebar"), getCollection("docs")]);
    const folderLabels = new Map(meta.filter((e) => e.data.label).map((e) => [dirOfFile(e.filePath!), e.data.label!]));
    const indexPages = new Map(
      docs.filter((e) => /(^|\/)index\.mdx?$/.test(e.filePath!))
        .map((e) => [dirOfFile(e.filePath!), e.data.sidebar.label ?? e.data.title]),
    );
    return { folderLabels, indexPages };
  })());

/** Breadcrumb trail for a docs URL path; folders without an index page link to their first sidebar child. */
export async function getCrumbs(pathname: string, pageLabel: string, sidebar: SidebarEntry[] = []): Promise<Crumb[]> {
  const { folderLabels, indexPages } = await getLookup();
  const segments = pathname.split("/").filter(Boolean);

  const labels: string[] = [];
  return segments.map((segment, i) => {
    const dir = segments.slice(0, i + 1).join("/");
    const isCurrent = i === segments.length - 1;
    const isIndexPage = indexPages.has(dir);
    const text =
      (i === 0 && topicLabels.get(segment)) ||
      (isCurrent && !isIndexPage && pageLabel) ||
      folderLabels.get(dir) ||
      (isCurrent && pageLabel) ||
      indexPages.get(dir) ||
      titleCase(segment);
    if (i > 0) labels.push(text);
    const href = isCurrent ? undefined : isIndexPage ? `/${dir}/` : i > 0 ? firstChildHref(sidebar, labels) : undefined;
    return { text, href };
  });
}
