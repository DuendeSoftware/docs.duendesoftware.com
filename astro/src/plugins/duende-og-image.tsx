import React from "react";
import type { RenderFunctionInput } from "astro-opengraph-images";
const { twj } = await import("tw-to-css");
import fs from "node:fs";
import path from "node:path";

const bgPath = path.join(process.cwd(), "src", "assets", "duende-og-bg.png");
const bgBase64 = `data:image/png;base64,${fs.readFileSync(bgPath).toString("base64")}`;

const logoPath = path.join(
  process.cwd(),
  "src",
  "assets",
  "duende-logo.svg",
);
const logoBase64 = `data:image/svg+xml;base64,${fs.readFileSync(logoPath).toString("base64")}`;

export async function duendeOpenGraphImage({
  title,
  description,
  url,
}: RenderFunctionInput): Promise<React.ReactNode> {
  let category =
    url
      .match(/\/([\w-]+)\//)
      ?.at(1)
      ?.toLowerCase() ?? "";

  const categoryMap: Record<string, string> = {
    bff: "BFF",
    identityserver: "IdentityServer",
    accesstokenmanagement: "Access Token Management",
    identitymodel: "IdentityModel",
    general: "General",
    "identitymodel-oidcclient": "IdentityModel OIDC Client",
  };

  category = categoryMap[category] ?? "General";

  return Promise.resolve(
    <div
      style={{
        ...twj("h-full w-full flex items-start justify-start bg-gray-50"),
      }}
    >
      <div style={twj("flex items-start justify-start h-full")}>
        <img
          alt="Duende background"
          style={{
            ...twj("absolute inset-0 w-full h-full"),
            ...{ objectFit: "cover" },
          }}
          src={bgBase64}
        />
        <img
          alt="Duende Software"
          style={{
            position: "absolute",
            top: "80px",
            left: "80px",
            height: "40px",
          }}
          src={logoBase64}
        />
        <div
          style={twj(
            "flex flex-col justify-end justify-items-start w-full h-full p-20",
          )}
        >
          {category && (
            <div style={twj("text-2xl italic font-bold text-black mt-4")}>
              {category}
            </div>
          )}
          <h1
            style={{
              ...twj("text-[70px] text-bold text-black"),
              fontFamily: "GT Canon",
            }}
          >
            {title}
          </h1>
          <div style={twj("text-3xl text-bold mb-3 text-black")}>
            {description}
          </div>
        </div>
      </div>
    </div>,
  );
}
