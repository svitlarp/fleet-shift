import path from "node:path";
import fsp from "node:fs/promises";
import { projectRoot } from "../manifest/path.ts";
import type { FuelManifest } from "../../types/manifest.ts";
import { parseWeightedFuelPrices } from "./parse-weighted-fuel-prices.ts";
import { lastFuelPrice } from "./parse-last-fuel-prices.ts";
import type { LastFuelPrice } from "./parse-last-fuel-prices.ts";


const ALLOWED_CPs = ["04", "05", "06", "13", "83", "84"];
const datasetDir = path.join(projectRoot, "/raw/fuel-prices");
const outputDir = path.join(projectRoot, "/parsed/fuel-prices");


export async function parseFuelPricesDataset(
  fuelManifestData: FuelManifest[],
): Promise<void> {

  // Read fuel prices data from entry point (to have last prices for end of the previous year)
  const filePathInput = path.join(projectRoot, "/raw/fuel-prices/entry-point/PrixCarburants_annuel_2015.xml");
  let previousYearPrices: LastFuelPrice[] = await lastFuelPrice(filePathInput, ALLOWED_CPs);

  // const sortedMainset = [...fuelManifestData].sort(
  //   (a, b) => a.year - b.year,
  // );

  for (const entry of fuelManifestData) {
    console.log(`Processing ${entry.fileName}`);
    const filePath = path.join(datasetDir, entry.fileName);
    
    // TODO: verifyHash

    const result = await parseWeightedFuelPrices(filePath, ALLOWED_CPs, previousYearPrices);
    console.log("Parsing completed");

    // Build output path for the file with weighted average fuel prices (PACA region, France)
    const outputFilePath = path.join(
      outputDir,
      `fuel-prices-avg-paca-${entry.year}.json`,
    );

    await fsp.writeFile(
      outputFilePath,
      JSON.stringify(result, null, 2),
      "utf-8",
    );

    previousYearPrices = result.endOFYearPrices;
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

  await parseFuelPricesDataset(parsedManifest);
}

await main().catch(console.error);
