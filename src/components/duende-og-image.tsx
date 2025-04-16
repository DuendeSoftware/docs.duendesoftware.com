import React from "react";
import type { RenderFunctionInput } from "astro-opengraph-images";
const { twj } = await import("tw-to-css");
import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src/assets/duende-og-bg.png");
const imageBase64 = `data:image/png;base64,${fs.readFileSync(filePath).toString("base64")}`;

export async function duendeOpenGraphImage({
  title,
  description,
}: RenderFunctionInput): Promise<React.ReactNode> {
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
          <h1 style={twj("text-[75px] text-bold text-white")}>{title}</h1>
          <div style={twj("text-3xl text-bold mb-3 text-white")}>
            {description}
          </div>
        </div>
      </div>
    </div>,
  );
}
