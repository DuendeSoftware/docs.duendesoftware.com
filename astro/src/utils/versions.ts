// Version helpers. Products + declared versions come from `products` in astro.config.mjs (virtual:dv-products).
// A page's range is its own frontmatter `versions` or the nearest folder `_meta.yml` one (pageVersions).
// Every since/until in frontmatter, _meta.yml and <Version> tags is validated against the declared list at build time (getProductVersions).
// Pages under general/, release notes and upgrade guides are never filtered (isUnfiltered).

import { getCollection } from "astro:content";
import { products } from "virtual:dv-products";

export type Versions = { since?: string; until?: string };
type ProductVersions = { versions: string[]; preview: string[]; unsupported: string[]; latest?: string };
type PageEntry = { filePath?: string; data: { versions?: Versions; preview?: boolean } };

const VERSION_FORMAT = /^\d+\.\d+$/;
const productByKey = new Map(products.map((p) => [p.key, p]));

// Path relative to content/docs; dirOf is its parent folder.
const relativePath = (path: string) => path.replace(/^.*content\/docs\//, "").replace(/^\//, "");
const parentDir = (dir: string) => dir.split("/").slice(0, -1).join("/");
const dirOf = (path: string) => parentDir(relativePath(path));

// Product key (first path segment) if declared in `products`.
export const productOf = (path: string) => {
  const first = relativePath(path).split("/")[0];
  return productByKey.has(first) ? first : undefined;
};

// Pages exempt from version filtering.
export const isUnfiltered = (path: string) => {
  const p = relativePath(path);
  return p.startsWith("general/") || p.includes("release-notes") || p.includes("upgrad");
};

// Numeric major.minor comparison.
const compare = (a: string, b: string) => {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
};

/** `since` is inclusive, `until` is exclusive. */
export const inRange = (version: string, { since, until }: Versions = {}) =>
  (!since || compare(version, since) >= 0) && (!until || compare(version, until) < 0);

// Human label, e.g. "BFF 4.0 and later".
export const label = (product: string, since?: string, until?: string) => {
  const p = productByKey.get(product);
  const name = p?.shortName ?? p?.label ?? product;
  if (since && until) return `${name} ${since} to before ${until}`;
  if (since) return `${name} ${since} and later`;
  if (until) return `${name} before ${until}`;
  return name;
};

// Map of folder -> versions from _meta.yml (cached).
let folderVersionsPromise: Promise<Map<string, Versions>> | undefined;
export const folderVersions = () =>
  (folderVersionsPromise ??= getCollection("autoSidebar").then(
    (entries) =>
      new Map(entries.filter((e) => e.data.versions).map((e) => [dirOf(e.filePath!), e.data.versions!])),
  ));

/** The page's own versions, else the nearest ancestor folder's. */
export async function pageVersions(entry: PageEntry): Promise<Versions | undefined> {
  if (entry.data.versions) return entry.data.versions;
  const folders = await folderVersions();
  for (let dir = dirOf(entry.filePath!); dir; dir = parentDir(dir)) {
    if (folders.has(dir)) return folders.get(dir);
  }
  return undefined;
}

/** Literal `since`/`until` values of every <Version> element in an MDX body. */
function versionTagValues(body: string, filePath: string) {
  const values: string[] = [];
  for (const [, attrs] of body.matchAll(/<Version\b([^>]*)>/g)) {
    for (const attr of attrs.matchAll(/\b(since|until)=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g)) {
      const value = attr[2] ?? attr[3] ?? attr[4];
      if (!VERSION_FORMAT.test(value)) {
        throw new Error(`Invalid <Version> value "${value}" in ${filePath}: use major.minor, e.g. "8.0"`);
      }
      values.push(value);
    }
  }
  return values;
}

// Declared versions plus validation pass; throws on undeclared/invalid values.
async function collectProductVersions(product: string): Promise<ProductVersions> {
  const declared = productByKey.get(product)?.versions ?? [];
  const versions = declared.map((v) => v.version);
  const preview = declared.filter((v) => v.preview).map((v) => v.version);
  const unsupported = declared.filter((v) => v.unsupported).map((v) => v.version);
  const both = preview.find((v) => unsupported.includes(v));
  if (both) throw new Error(`${product} version "${both}" is declared both preview and unsupported in astro/astro.config.mjs; use only one.`);
  const latest = declared.find((v) => !v.preview)?.version;

  const check = (value: string | undefined, file: string) => {
    if (value && !versions.includes(value)) {
      throw new Error(
        `Undeclared ${product} version "${value}" in ${file}. Allowed: ${versions.join(", ") || "(none)"}. Declare it in products in astro/astro.config.mjs.`,
      );
    }
  };
  const checkRange = (range: Versions | undefined, file: string) => (check(range?.since, file), check(range?.until, file));
  const isFiltered = (path: string) => productOf(path) === product && !isUnfiltered(path);

  for (const [dir, range] of await folderVersions()) {
    if (isFiltered(dir + "/x")) checkRange(range, `${dir}/_meta.yml`);
  }
  for (const entry of await getCollection("docs")) {
    if (!isFiltered(entry.filePath!)) continue;
    checkRange(entry.data.versions, entry.filePath!);
    versionTagValues(entry.body ?? "", entry.filePath!).forEach((v) => check(v, entry.filePath!));
  }

  return { versions, preview, unsupported, latest };
}

// Cached per product.
const productVersionsCache = new Map<string, Promise<ProductVersions>>();
export const getProductVersions = (product: string) => {
  if (!productVersionsCache.has(product)) productVersionsCache.set(product, collectProductVersions(product));
  return productVersionsCache.get(product)!;
};

// True if the version is declared as preview for the product.
export const isPreviewVersion = (product: string, version?: string) =>
  !!version && !!productByKey.get(product)?.versions?.some((v) => v.preview && v.version === version);

// Frontmatter `preview` flag OR `since` is a preview version.
export async function isPreviewPage(entry: PageEntry) {
  if (entry.data.preview === true) return true;
  const product = productOf(entry.filePath!);
  return !!product && isPreviewVersion(product, (await pageVersions(entry))?.since);
}

// Preview version a preview page's notice links to: the page's own `since` if it is a preview version, else the product's newest preview.
export function previewSwitchVersion(product?: string, since?: string) {
  if (!product) return undefined;
  if (isPreviewVersion(product, since)) return since;
  return productByKey.get(product)?.versions?.find((v) => v.preview)?.version;
}
