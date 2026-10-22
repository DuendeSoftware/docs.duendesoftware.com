// Types for the `virtual:dv-products` module that astro.config.mjs generates from its `products` list.
// Consumed by utils/versions.ts, the version selector and the middleware.
declare module "virtual:dv-products" {
  export const products: {
    key: string;
    label: string;
    shortName?: string;
    badge?: string;
    upgrades?: string;
    versions?: { version: string; preview?: boolean; unsupported?: boolean }[];
  }[];
  /** Starlight icon name per product key; shared by the sidebar topics and the homepage. */
  export const productIcons: Record<string, string>;
}
