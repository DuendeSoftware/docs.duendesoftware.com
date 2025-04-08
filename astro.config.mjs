// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import starlightClientMermaid from "@pasqal-io/starlight-client-mermaid";
import starlightAutoSidebar from "starlight-auto-sidebar";
import starlightGiscus from "starlight-giscus";
import redirectFrom from "astro-redirect-from";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import starlightHeadingBadges from "starlight-heading-badges";
import starlightLlmsTxt from "starlight-llms-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.duendesoftware.com",
  trailingSlash: "ignore",
  redirects: {},
  integrations: [
    starlight({
      customCss: ["./src/styles/custom.css"],
      plugins: [
        starlightLlmsTxt(),
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
        // --
        // Preload Google Fonts
        {
          tag: "link",
          attrs: {
            href: "https://fonts.googleapis.com",
            rel: "preconnect",
          },
        },
        {
          tag: "link",
          attrs: {
            href: "https://fonts.gstatic.com",
            rel: "preconnect",
            crossorigin: true,
          },
        },
        {
          tag: "link",
          attrs: {
            href: "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap",
            rel: "stylesheet",
          },
        },
        // --
      ],
      logo: {
        light: "./src/assets/duende-logo.svg",
        dark: "./src/assets/duende-logo-dark.svg",
        replacesTitle: true,
      },
      lastUpdated: true,
      editLink: {
        baseUrl:
          "https://github.com/DuendeSoftware/docs.duendesoftware.com/edit/main/docs/",
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
          href: "https://blog.duendesoftware.com/",
        },
      ],
      components: {
        SkipLink: "./src/components/SkipLink.astro",
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
      ],
    }),
    redirectFrom({
      contentDir: "./src/content/docs",
    }),
  ],
  markdown: {
    rehypePlugins: [
      //rehypeAstroRelativeMarkdownLinks,
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          // Wrap the heading text in a link.
          behavior: "wrap",
        },
      ],
    ],
  },
});
