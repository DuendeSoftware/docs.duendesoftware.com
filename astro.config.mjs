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
import rehypeAstroRelativeMarkdownLinks from "astro-rehype-relative-markdown-links";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.duendesoftware.com",
  trailingSlash: "ignore",
  redirects: {},
  integrations: [
    starlight({
      customCss: ["./src/styles/custom.css"],
      plugins: [
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
          icon: "github",
          label: "GitHub",
          href: "https://github.com/DuendeSoftware",
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
          label: "Email",
          href: "mailto:contact@duendesoftware.com",
        },
      ],
      components: {},
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
