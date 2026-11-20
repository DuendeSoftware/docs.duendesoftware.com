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

// Starlight's resolved component overrides. Import these (not the raw @astrojs/starlight components)
// so that plugin overrides apply - e.g. starlight-heading-badges overrides the table of contents.
declare module "virtual:starlight/components/TableOfContents" {
  const Component: typeof import("@astrojs/starlight/components/TableOfContents.astro").default;
  export default Component;
}
declare module "virtual:starlight/components/MobileTableOfContents" {
  const Component: typeof import("@astrojs/starlight/components/MobileTableOfContents.astro").default;
  export default Component;
}
