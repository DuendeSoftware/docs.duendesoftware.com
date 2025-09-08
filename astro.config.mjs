import { defineConfig, fontProviders } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import starlightClientMermaid from "@pasqal-io/starlight-client-mermaid";
import starlightAutoSidebar from "starlight-auto-sidebar";
import starlightGiscus from "starlight-giscus";
import redirectFrom from "astro-redirect-from";
import starlightHeadingBadges from "starlight-heading-badges";
import starlightLlmsTxt from "starlight-llms-txt";
import rehypeAstroRelativeMarkdownLinks from "astro-rehype-relative-markdown-links";
import opengraphImages from "astro-opengraph-images";
import rehypeExternalLinks from "rehype-external-links";
import * as fs from "node:fs";

// don't convert to path aliases, it doesn't work here
// https://github.com/withastro/astro/issues/9782
import { duendeOpenGraphImage } from "./src/plugins/duende-og-image.js";
import removeMarkdownExtensions from "./src/plugins/remove-markdown-extensions.js";
import staticRedirects from "./src/plugins/static-redirects.js";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.duendesoftware.com",
  trailingSlash: "ignore",
  redirects: {},
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Roboto",
        cssVariable: "--font-roboto",
        weights: ["100 900", "bold"],
        styles: ["normal", "italic"],
        display: "swap",
      },
    ],
  },
  integrations: [
    starlight({
      customCss: ["./src/styles/custom.css"],
      routeMiddleware: ["./src/plugins/search-topic-middleware.ts"],
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
              paths: ["accesstokenmanagement/**"],
            },
            {
              label: "IdentityModel.OidcClient",
              description:
                "Documentation for Duende's open-source IdentityModel.OidcClient library which can be used to build OIDC native clients with a variety of .NET UI tools",
              paths: ["identitymodel-oidcclient/**"],
            },
          ],
        }),
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
        }),
        starlightClientMermaid({
          /* options */
        }),
        starlightLinksValidator({
          errorOnFallbackPages: false,
          errorOnInconsistentLocale: true,
          errorOnRelativeLinks: false,
          errorOnLocalLinks: false,
        }),
      ],
      title: "Duende Software Docs",
      head: [
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
            src: "//js.hs-scripts.com/47428297.js",
            "is:inline": true,
            defer: true,
            async: true,
          },
        },
      ],
      logo: {
        light: "./src/assets/duende-logo.svg",
        dark: "./src/assets/duende-logo-dark.svg",
        replacesTitle: true,
      },
      lastUpdated: true,
      editLink: {
        baseUrl:
          "https://github.com/DuendeSoftware/docs.duendesoftware.com/edit/main/",
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
      },
      sidebar: [
        {
          label: "General Information",
          autogenerate: { directory: "general" },
        },
        {
          label: "IdentityServer",
          autogenerate: { directory: "identityserver" },
          collapsed: true,
        },
        {
          label: "BFF Security Framework",
          autogenerate: { directory: "bff" },
          collapsed: true,
        },
        {
          label: "Access Token Management",
          badge: "oss",
          autogenerate: { directory: "accesstokenmanagement" },
          collapsed: true,
        },
        {
          label: "IdentityModel",
          badge: "oss",
          autogenerate: { directory: "identitymodel" },
          collapsed: true,
        },
        {
          label: "IdentityModel.OidcClient",
          badge: "oss",
          autogenerate: { directory: "identitymodel-oidcclient" },
          collapsed: true,
        },
        {
          label: "Introspection for ASP.NET Core",
          badge: "oss",
          autogenerate: { directory: "introspection-auth-handler" },
          collapsed: true,
        },
      ],
    }),
    redirectFrom({
      contentDir: "./src/content/docs",
    }),
    staticRedirects(),
    opengraphImages({
      options: {
        fonts: [
          {
            name: "Roboto",
            weight: 400,
            style: "normal",
            data: fs.readFileSync(
              "node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff",
            ),
          },
        ],
      },
      render: duendeOpenGraphImage,
    }),
  ],
  markdown: {
    remarkPlugins: [[removeMarkdownExtensions, { ignoreRelativeLinks: true }]],
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
  },
});
