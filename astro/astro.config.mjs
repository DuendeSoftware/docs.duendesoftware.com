import { defineConfig, fontProviders } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import mermaid from "astro-mermaid";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import starlightSidebarTopics from "starlight-sidebar-topics";
import starlightAutoSidebar from "starlight-auto-sidebar";
import starlightGiscus from "starlight-giscus";
import redirectFrom from "astro-redirect-from";
import starlightHeadingBadges from "starlight-heading-badges";
import starlightLlmsTxt from "starlight-llms-txt";
import rehypeAstroRelativeMarkdownLinks from "astro-rehype-relative-markdown-links";
import opengraphImages from "astro-opengraph-images";
import rehypeExternalLinks from "rehype-external-links";
import wawoff from "wawoff2";
import * as fs from "node:fs";
import { icons as materialSymbols } from "@iconify-json/material-symbols";

// don't convert to path aliases, it doesn't work here
// https://github.com/withastro/astro/issues/9782
import { duendeOpenGraphImage } from "./src/plugins/duende-og-image.js";
import removeMarkdownExtensions from "./src/plugins/remove-markdown-extensions.js";
import staticRedirects from "./src/plugins/static-redirects.js";
import markdownOutput from "./src/plugins/markdown-output.js";
import contributorMapping from "./src/plugins/contributor-mapping.js";
import remarkVersionProduct from "./src/plugins/remark-version-product.js";

// Single declaration of the products: drives the sidebar and the version selector.
// `versions`: newest first; the first non-preview entry is latest; every since/until
// in the content must be listed (a build-time check is done for this).
// `unsupported: true` marks end-of-support versions (label + notice); not combinable with `preview`.
// `upgrades`: optional upgrade guide URL, linked from the unsupported-version notice.
const products = [
  {
    key: "identityserver",
    label: "IdentityServer",
    shortName: "IdentityServer",
    upgrades: "/identityserver/upgrades/",
    versions: [
      { version: "8.1", preview: true },
      { version: "8.0" },
      { version: "7.4" },
      { version: "7.3" },
      { version: "7.2" },
      { version: "7.1" },
      { version: "7.0" },
      { version: "6.3", unsupported: true },
      { version: "6.2", unsupported: true },
      { version: "6.1", unsupported: true },
      { version: "6.0", unsupported: true },
      { version: "5.2", unsupported: true },
      { version: "5.1", unsupported: true },
      { version: "5.0", unsupported: true },
    ],
  },
  { key: "bff", label: "BFF Security Framework", shortName: "BFF", upgrades: "/bff/upgrading/", versions: [
    { version: "4.3" },
    { version: "4.2" },
    { version: "4.1" },
    { version: "4.0" },
    { version: "3.1" },
    { version: "3.0" }
  ] },
  { key: "accesstokenmanagement", label: "Access Token Management", versions: [
    { version: "4.3" },
    { version: "4.2" },
    { version: "4.1" },
    { version: "4.0" },
    { version: "3.3" },
    { version: "3.2" },
    { version: "3.1" },
    { version: "3.0" }
  ] },
  { key: "identitymodel", label: "IdentityModel", versions: [
    { version: "8.1" },
    { version: "8.0" },
    { version: "7.1" },
    { version: "7.0" }
  ] },
  { key: "identitymodel-oidcclient", label: "IdentityModel.OidcClient" },
  { key: "introspection", label: "ASP.NET Core Introspection", shortName: "Introspection" },
];

// Sidebar topics (top-of-sidebar switcher): General Information plus one per product.
// The icons must match the product cards in src/content/docs/index.mdx.
const productIcons = {
  identityserver: "open-book",
  bff: "window",
  accesstokenmanagement: "clock",
  identitymodel: "puzzle",
  "identitymodel-oidcclient": "laptop",
  introspection: "magnifier",
};

const topics = [
  { label: "General Information", link: "/general/", icon: "information", items: [{ autogenerate: { directory: "general" } }] },
  ...products.map(({ key, label, badge }) => ({
    label,
    link: `/${key}/`,
    icon: productIcons[key],
    ...(badge && { badge }),
    items: [{ autogenerate: { directory: key } }],
  })),
];

const productsVirtualModule = () => ({
  name: "dv-products",
  resolveId: (id) => (id === "virtual:dv-products" ? "\0virtual:dv-products" : undefined),
  load: (id) =>
    id === "\0virtual:dv-products"
      ? `export const products = ${JSON.stringify(products)};`
      : undefined,
});

// https://astro.build/config
const isDev = import.meta.env.DEV;

export default defineConfig({
  site: "https://docs.duendesoftware.com",
  trailingSlash: "ignore",
  redirects: {},
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Funnel Sans",
      cssVariable: "--font-funnel-sans",
      weights: ["300 800", "bold"],
      styles: ["normal", "italic"],
      display: "swap",
    },
    {
      provider: fontProviders.local(),
      name: "GT Canon",
      cssVariable: "--font-gt-canon",
      display: "swap",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/GT-Canon-M-Standard-Semibold.woff2"],
            weights: ["400", "500", "600", "700"],
            styles: ["normal"],
          },
        ],
      },
    },
  ],
  integrations: [
    mermaid({
      // Default theme: 'default', 'dark', 'forest', 'neutral', 'base'
      theme: "default",
      autoTheme: true,
      enableLog: false,
      iconPacks: [
        {
          name: "material-symbols",
          icons: materialSymbols,
        },
      ],
    }),
    contributorMapping({
      include: ["src/content/docs/**"],
      repo: "DuendeSoftware/docs.duendesoftware.com",
      maxAgeDays: isDev ? 10 : 0,
    }),
    starlight({
      customCss: ["./src/styles/custom.css"],
      routeMiddleware: [
        "./src/plugins/search-topic-middleware.ts",
        "./src/plugins/version-middleware.ts",
      ],
      plugins: [
        starlightLlmsTxt({
          pageSeparator: "\n-----\n",
          customSets: [
            {
              label: "General Information",
              description:
                "General Information about Duende products, including license information, support options, security best practices and a glossary.",
              paths: ["general/**"],
            },
            {
              label: "IdentityServer",
              description: "Documentation for Duende IdentityServer",
              paths: ["identityserver/**"],
            },
            {
              label: "IdentityServer Quickstarts",
              description:
                "Step-by-step tutorials to get started with Duende IdentityServer",
              paths: ["identityserver/quickstarts/**"],
            },
            {
              label: "IdentityServer Sample Code",
              description: "Sample projects for Duende IdentityServer",
              paths: ["identityserver/samples/**"],
            },
            {
              label: "BFF Security Framework",
              description:
                "Documentation for Duende's Backend for Frontend (BFF) framework, used to secure browser-based frontends (e.g. SPAs with React, Vue, Angular, or Blazor applications) with ASP.NET Core backends",
              paths: ["bff/**"],
            },
            {
              label: "Access Token Management",
              description:
                "Documentation for Duende's open-source Access Token Management library which provides automatic access token management features for .NET worker and ASP.NET Core web applications",
              paths: ["accesstokenmanagement/**"],
            },
            {
              label: "IdentityModel",
              description:
                "Documentation for Duende's open-source IdentityModel library which provides an object model to interact with the endpoints defined in the various OAuth and OpenId Connect specifications",
              paths: ["identitymodel/**"],
            },
            {
              label: "IdentityModel.OidcClient",
              description:
                "Documentation for Duende's open-source IdentityModel.OidcClient library which can be used to build OIDC native clients with a variety of .NET UI tools",
              paths: ["identitymodel-oidcclient/**"],
            },
          ],
        }),
        starlightSidebarTopics(
          topics,
        ),
        starlightHeadingBadges(),
        starlightAutoSidebar(),
        starlightGiscus({
          repo: "duendesoftware/community",
          repoId: "R_kgDONlV_Gw",
          category: "Documentation",
          categoryId: "DIC_kwDONlV_G84CnEmQ",
          mapping: "pathname",
          reactions: true,
          inputPosition: "top",
          lazy: true,
          theme: {
            light: "noborder_light",
            dark: "noborder_gray",
          },
        }),
        starlightLinksValidator({
          errorOnFallbackPages: false,
          errorOnInconsistentLocale: true,
          errorOnRelativeLinks: false,
          errorOnLocalLinks: false,
        }),
      ],
      title: "Duende Docs",
      favicon: "/favicon.png",
      head: [
        // Favicon ICO fallback for older browsers
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/favicon.ico",
            sizes: "32x32",
          },
        },
        // Google Tag Manager
        {
          tag: "script",
          content:
            "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f); })(window,document,'script','dataLayer','GTM-MMR39D3G');",
        },
        // HubSpot
        {
          tag: "script",
          attrs: {
            id: "hs-script-loader",
            src: "https://js.hs-scripts.com/47428297.js",
            defer: true,
            async: true,
          },
        },
        // Ahrefs
        {
          tag: "script",
          attrs: {
            id: "ahrefs-script-loader",
            "data-key": "PPGvkEFhR5WtJM7gT/XqAg",
            src: "https://analytics.ahrefs.com/analytics.js",
            async: true,
          },
        },
        // Markdown content negotiation
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "text/markdown",
          },
        },
      ],
      logo: {
        alt: "Duende Software",
        light: "./src/assets/duende-logo.svg",
        dark: "./src/assets/duende-logo-dark.svg",
        replacesTitle: true,
      },
      lastUpdated: true,
      editLink: {
        baseUrl:
          "https://github.com/DuendeSoftware/docs.duendesoftware.com/edit/main/astro/",
      },
      social: [
        {
          icon: "external",
          label: "Duende Software",
          href: "https://duendesoftware.com/",
        },
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/DuendeSoftware/community",
        },
        {
          icon: "blueSky",
          label: "Bluesky",
          href: "https://bsky.app/profile/duendesoftware.com",
        },
        {
          icon: "linkedin",
          label: "LinkedIn",
          href: "https://www.linkedin.com/company/duendesoftware/",
        },
        {
          icon: "email",
          label: "Contact",
          href: "https://duendesoftware.com/contact/general",
        },
        {
          icon: "rss",
          label: "Blog",
          href: "https://duendesoftware.com/blog",
        },
      ],
      components: {
        SkipLink: "./src/components/SkipLink.astro",
        Banner: "./src/components/Banner.astro",
        Head: "./src/components/Head.astro",
        Pagination: "./src/components/Pagination.astro",
        PageSidebar: "./src/components/PageSidebar.astro",
        MarkdownContent: "./src/components/MarkdownContent.astro",
        Sidebar: "./src/components/Sidebar.astro",
      },
    }),
    redirectFrom({
      contentDir: "./src/content/docs",
    }),
    staticRedirects(),
    markdownOutput(),
    opengraphImages({
      options: {
        fonts: [
          {
            name: "Funnel Sans",
            weight: 400,
            style: "normal",
            data: fs.readFileSync(
              "node_modules/@fontsource/funnel-sans/files/funnel-sans-latin-400-normal.woff",
            ),
          },
          {
            name: "GT Canon",
            weight: 700,
            style: "normal",
            data: await wawoff.decompress(
              fs.readFileSync(
                "src/assets/fonts/GT-Canon-M-Standard-Semibold.woff2",
              ),
            ),
          },
        ],
      },
      render: duendeOpenGraphImage,
    }),
  ],
  vite: { plugins: [productsVirtualModule()] },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkVersionProduct,
        [removeMarkdownExtensions, { ignoreRelativeLinks: true }],
      ],
      rehypePlugins: [
        [
          rehypeAstroRelativeMarkdownLinks,
          {
            trailingSlash: "always",
            collections: {
              docs: {
                base: false,
              },
            },
          },
        ],
        [
          rehypeExternalLinks,
          {
            target: "_blank",
            rel: ["noopener", "noreferrer"],
          },
        ],
      ],
    }),
  },
});
