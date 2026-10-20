// Route middleware: version badges, sidebar attributes and head tags for the version selector.
import { defineRouteMiddleware, type StarlightRouteData } from "@astrojs/starlight/route-data";
import { getCollection } from "astro:content";
import { products } from "virtual:dv-products";
import {
  getProductVersions,
  inRange,
  isPreviewPage,
  isUnfiltered,
  label,
  pageVersions,
  productOf,
  type Versions,
} from "../utils/versions";

type PageInfo = { versions?: Versions; preview: boolean };
type SidebarEntry = any;
type HeadTag = StarlightRouteData["head"][number];

const normalizePath = (s: string) => "/" + s.replace(/^\/+|\/+$/g, "");

let validated: Promise<unknown> | undefined;
const validateAllProducts = () => (validated ??= Promise.all(products.map((p) => getProductVersions(p.key))));

let pageInfoByPath: Promise<Map<string, PageInfo>> | undefined;
const getPageInfoByPath = () =>
  (pageInfoByPath ??= (async () => {
    const map = new Map<string, PageInfo>();
    for (const entry of await getCollection("docs")) {
      const slug = entry.id.replace(/\/index$/, "").replace(/^index$/, "");
      map.set(normalizePath(slug), { versions: await pageVersions(entry), preview: await isPreviewPage(entry) });
    }
    return map;
  })());

function walkSidebar(entries: SidebarEntry[], visit: (link: SidebarEntry) => Promise<void>): Promise<unknown> {
  return Promise.all(entries.map((e) => (e.type === "group" ? walkSidebar(e.entries, visit) : visit(e))));
}

type Badge = { text: string; variant: string; class?: string };

// Moves a badge shared by every entry of a group onto the group; returns the badge the entry exposes upward.
function hoistBadges(entry: SidebarEntry, hoist: boolean): Badge | undefined {
  if (entry.type !== "group") return entry.badge;
  const childBadges: (Badge | undefined)[] = entry.entries.map((child: SidebarEntry) => hoistBadges(child, true));
  const [first] = childBadges;
  const uniform = first && childBadges.every((b) => b?.text === first.text);
  if (!uniform || entry.badge || !hoist) return entry.badge;
  for (const child of entry.entries) delete child.badge;
  entry.badge = first;
  return first;
}

async function badgeFor(page: PageInfo, product: string) {
  if (page.preview) return { text: "preview", variant: "caution" };
  const { latest } = await getProductVersions(product);
  if (page.versions?.since && page.versions.since === latest) return { text: "new", variant: "tip", class: "dv-new" };
  return undefined;
}

function sidebarAttrs({ versions }: PageInfo) {
  const attrs: Record<string, string> = {};
  if (versions?.since) attrs["data-since"] = versions.since;
  if (versions?.until) attrs["data-until"] = versions.until;
  return attrs;
}

const pagefindTag = (value: string): HeadTag => ({
  tag: "meta",
  attrs: { "data-pagefind-filter": "version[content]", content: value },
});

function pagefindFilterTags(product: string, all: string[], range?: Versions): HeadTag[] {
  return all.filter((v) => inRange(v, range)).map((v) => pagefindTag(`${product}:${v}`));
}

async function versionHeadTags(entry: any, product: string): Promise<HeadTag[]> {
  const range = await pageVersions(entry);
  const { versions, preview, unsupported, latest } = await getProductVersions(product);
  return [
    {
      tag: "meta",
      attrs: {
        name: "dv-page",
        "data-product": product,
        ...sidebarAttrs({ versions: range, preview: false }),
        "data-label": label(product, range?.since, range?.until),
      },
    },
    {
      tag: "script",
      attrs: { type: "application/json", id: "dv-versions" },
      content: JSON.stringify({ product, versions, preview, unsupported, latest, upgrades: products.find((p) => p.key === product)?.upgrades }),
    },
    ...pagefindFilterTags(product, versions, range),
  ];
}

export const onRequest = defineRouteMiddleware(async (context) => {
  const { sidebar, entry, head } = context.locals.starlightRoute;
  const base = normalizePath(import.meta.env.BASE_URL ?? "/");
  const pathOf = (href: string) => {
    const path = normalizePath(href.split(/[?#]/)[0]);
    return base !== "/" && path.startsWith(base) ? normalizePath(path.slice(base.length)) : path;
  };

  await validateAllProducts();
  const pages = await getPageInfoByPath();
  await walkSidebar(sidebar, async (link) => {
    const path = pathOf(link.href).slice(1) + "/x";
    const page = pages.get(pathOf(link.href));
    const product = productOf(path);
    if (!page || !product || isUnfiltered(path)) return;
    const badge = await badgeFor(page, product);
    if (badge) link.badge = badge;
    Object.assign(link.attrs, sidebarAttrs(page));
  });

  for (const root of sidebar) hoistBadges(root, false);

  const filePath = entry.filePath ?? "";
  const product = productOf(filePath);
  if (!product || isUnfiltered(filePath)) {
    head.push(pagefindTag("*"));
    return;
  }
  head.push(...(await versionHeadTags(entry, product)));
});
