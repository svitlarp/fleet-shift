import path from "node:path";
import fsp from "node:fs/promises";
import { projectRoot } from "../manifest/path.ts";
import type { FuelManifest } from "../../types/manifest.ts";
import { parseStations } from "./parse-file.ts";

const ALLOWED_CPs = ["04", "05", "06", "13", "83", "84"];
console.log(projectRoot);
const datasetDir = path.join(projectRoot, "/raw/fuel-prices");
const outputDir = path.join(projectRoot, "/parsed/fuel-prices");

export async function processDataset(
  fuelManifestData: FuelManifest[],
): Promise<void> {
  for (const entry of fuelManifestData) {
    console.log(`Processing ${entry.fileName}`);
    const filePath = path.join(datasetDir, entry.fileName);

    // TODO: verifyHash
    const result = await parseStations(filePath, ALLOWED_CPs);
    console.log("Parsing completed");

    const outputFilePath = path.join(
      outputDir,
      `fuel-weighted-prices-${entry.year}.json`,
    );

    await fsp.writeFile(
      outputFilePath,
      JSON.stringify(result, null, 2),
      "utf-8",
    );
    console.log(`Created: ${outputFilePath}`);
  }
}

function isFuelManifestArray(data: unknown): data is FuelManifest[] {
  return Array.isArray(data);
}

async function main() {
  const manifestPath = path.join(projectRoot, "manifests/fuel-manifest.json");

  const manifestContent = await fsp.readFile(manifestPath, "utf-8");
  const parsedManifest: unknown = JSON.parse(manifestContent);

  if (!isFuelManifestArray(parsedManifest)) {
    throw new Error("Invalid fuel manifest format");
  }

  await processDataset(parsedManifest);
}

await main().catch(console.error);
