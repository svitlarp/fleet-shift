import path from "node:path";
import fsp from "node:fs/promises";
import { dataRoot } from "../config/path.ts";
import { loadEnvFile } from "node:process";
import type { FuelManifest } from "../types/manifest.ts";
import { parseWeightedFuelPrices } from "../lib/parsing/parse-weighted-fuel-prices.ts";
import { lastFuelPrice } from "../lib/parsing/parse-last-fuel-prices.ts";
import type { StationFuelPrices } from "../types/parser.ts";
import { verifyHash } from "../lib/parsing/verify-hash.ts";



const ALLOWED_CPs = ["04", "05", "06", "13", "83", "84"];
const filePathInput = path.join(
  dataRoot,
  "/raw/fuel-prices/entry-point/PrixCarburants_annuel_2015.xml",
);
const datasetDir = path.join(dataRoot, "/raw/fuel-prices");
const outputDir = path.join(dataRoot, "/parsed/fuel-prices");

export async function parseFuelPricesDataset(
  fuelManifestData: FuelManifest[],
): Promise<void> {
  // Read fuel prices data from entry point (to have last prices for end of the previous year)
  let previousYearPrices: StationFuelPrices[] = await lastFuelPrice(
    filePathInput,
    ALLOWED_CPs,
  );

  // const sortedMainset = [...fuelManifestData].sort(
  //   (a, b) => a.year - b.year,
  // );

  for (const entry of fuelManifestData) {
    console.log(`Processing ${entry.fileName}`);
    const filePath = path.join(datasetDir, entry.fileName);

    await verifyHash(filePath, entry.hash);

    const result = await parseWeightedFuelPrices(
      filePath,
      ALLOWED_CPs,
      previousYearPrices,
    );
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

    previousYearPrices = result.endOfYearPrices;
    console.log(`Created: ${outputFilePath}`);
  }
}

function isFuelManifestArray(data: unknown): data is FuelManifest[] {
  return Array.isArray(data);
}

async function main() {
  const manifestPath = path.join(dataRoot, "manifests/fuel-manifest.json");

  const manifestContent = await fsp.readFile(manifestPath, "utf-8");
  const parsedManifest: unknown = JSON.parse(manifestContent);

  if (!isFuelManifestArray(parsedManifest)) {
    throw new Error("Invalid fuel manifest format");
  }

  await parseFuelPricesDataset(parsedManifest);
}

await main().catch(console.error);
