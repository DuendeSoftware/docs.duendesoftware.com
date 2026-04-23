import * as fs from "node:fs";
import * as path from "node:path";
import JSZip from "jszip";

const CACHE_DIR = path.join(
  process.cwd(),
  "node_modules",
  ".cache",
  "nuget-api",
);

const NUGET_V3_INDEX = "https://api.nuget.org/v3/index.json";

interface NuGetServiceIndex {
  resources: Array<{
    "@id": string;
    "@type": string;
  }>;
}

/**
 * Resolve the PackageBaseAddress (flat container) URL from the NuGet v3 service index.
 */
let _baseUrl: string | null = null;
async function getPackageBaseUrl(): Promise<string> {
  if (_baseUrl) return _baseUrl;

  const res = await fetch(NUGET_V3_INDEX);
  const index: NuGetServiceIndex = await res.json();
  const resource = index.resources.find(
    (r) =>
      r["@type"] === "PackageBaseAddress/3.0.0" ||
      r["@type"].startsWith("PackageBaseAddress"),
  );
  if (!resource) throw new Error("Could not find PackageBaseAddress in NuGet service index");
  _baseUrl = resource["@id"].replace(/\/$/, "");
  return _baseUrl;
}

/**
 * Get the latest stable version of a NuGet package.
 */
async function getLatestVersion(packageId: string): Promise<string> {
  const baseUrl = await getPackageBaseUrl();
  const id = packageId.toLowerCase();
  const res = await fetch(`${baseUrl}/${id}/index.json`);
  if (!res.ok) throw new Error(`Failed to fetch versions for ${packageId}: ${res.status}`);

  const data: { versions: string[] } = await res.json();
  // Filter to stable versions (no prerelease suffix)
  const stable = data.versions.filter((v) => !v.includes("-"));
  if (stable.length === 0) {
    // Fall back to latest of any kind
    return data.versions[data.versions.length - 1];
  }
  return stable[stable.length - 1];
}

/**
 * Download a .nupkg and extract the XML documentation file for a given assembly.
 * Returns the path to the cached XML file.
 *
 * Caching strategy: packages are cached by id+version in node_modules/.cache/nuget-api/
 */
export async function getXmlDocPath(
  packageId: string,
  version?: string,
): Promise<string> {
  const resolvedVersion = version ?? (await getLatestVersion(packageId));
  const id = packageId.toLowerCase();
  const cacheKey = `${id}.${resolvedVersion}`;
  const cacheDir = path.join(CACHE_DIR, cacheKey);
  const xmlGlob = `${id}.xml`;

  // Check cache first
  if (fs.existsSync(cacheDir)) {
    const xmlFile = findXmlDoc(cacheDir, packageId);
    if (xmlFile) {
      console.log(`[nuget-api] Cache hit: ${cacheKey}`);
      return xmlFile;
    }
  }

  console.log(`[nuget-api] Downloading ${packageId} ${resolvedVersion}...`);

  const baseUrl = await getPackageBaseUrl();
  const nupkgUrl = `${baseUrl}/${id}/${resolvedVersion}/${id}.${resolvedVersion}.nupkg`;
  const res = await fetch(nupkgUrl);
  if (!res.ok) throw new Error(`Failed to download ${nupkgUrl}: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // Create cache directory
  fs.mkdirSync(cacheDir, { recursive: true });

  // Extract only XML doc files (lib/*/*.xml)
  const xmlEntries = Object.keys(zip.files).filter(
    (name) => name.startsWith("lib/") && name.endsWith(".xml"),
  );

  for (const entry of xmlEntries) {
    const content = await zip.files[entry].async("nodebuffer");
    const outPath = path.join(cacheDir, entry);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);
  }

  const xmlFile = findXmlDoc(cacheDir, packageId);
  if (!xmlFile) {
    throw new Error(
      `No XML documentation found in ${packageId} ${resolvedVersion}. Available entries: ${xmlEntries.join(", ")}`,
    );
  }

  console.log(`[nuget-api] Extracted XML docs to ${xmlFile}`);
  return xmlFile;
}

/**
 * Find the best XML doc file for a package. Prefers the highest TFM.
 */
function findXmlDoc(cacheDir: string, packageId: string): string | null {
  const libDir = path.join(cacheDir, "lib");
  if (!fs.existsSync(libDir)) return null;

  const tfms = fs.readdirSync(libDir).sort().reverse(); // prefer higher TFMs like net8.0 over netstandard2.0
  for (const tfm of tfms) {
    const xmlPath = path.join(libDir, tfm, `${packageId}.xml`);
    if (fs.existsSync(xmlPath)) return xmlPath;
  }

  // Fallback: any .xml file
  for (const tfm of tfms) {
    const tfmDir = path.join(libDir, tfm);
    const files = fs.readdirSync(tfmDir).filter((f) => f.endsWith(".xml"));
    if (files.length > 0) return path.join(tfmDir, files[0]);
  }

  return null;
}
