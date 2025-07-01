import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

const topics = [
  { key: "/bff/", value: "Backend For Frontend Security Library" },
  { key: "/accesstokenmanagement/", value: "Access Token Management" },
  { key: "/general/", value: "General" },
  { key: "/identitymodel/", value: "Identity Model" },
  {
    key: "/identitymodel-oidcclient/",
    value: "Identity Model - OpenID Connect Client",
  },
  { key: "/identityserver/", value: "IdentityServer" },
];

export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals;
  const path = starlightRoute.entry.filePath;

  const topic = topics.find((t) => path.includes(t.key))?.value ?? "Unknown";

  starlightRoute.head.push({
    tag: "meta",
    attrs: { "data-pagefind-meta": `Topic: ${topic}` },
  });
});
