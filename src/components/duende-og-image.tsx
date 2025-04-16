import React from "react";
import type { RenderFunctionInput } from "astro-opengraph-images";
const { twj } = await import("tw-to-css");
import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "assets", "duende-og-bg.png");
const imageBase64 = `data:image/png;base64,${fs.readFileSync(filePath).toString("base64")}`;

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
          src={imageBase64}
        />
        <div
          style={twj(
            "flex flex-col justify-end justify-items-start w-full h-full p-20",
          )}
        >
          {category && (
            <div style={twj("text-2xl italic font-bold text-gray-500 mt-4")}>
              {category}
            </div>
          )}
          <h1 style={twj("text-[70px] text-bold text-white")}>{title}</h1>
          <div style={twj("text-3xl text-bold mb-3 text-white")}>
            {description}
          </div>
        </div>
      </div>
    </div>,
  );
}
