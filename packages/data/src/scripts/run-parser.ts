import path from "node:path";
import fsp from "node:fs/promises";
import { paths } from "../config/paths.ts";
import { PACA_DEPARTMENTS } from "../config/regions.ts";
import type { FuelManifest } from "../types/manifest.ts";
import { parseWeightedFuelPrices } from "../lib/parsing/parse-weighted-fuel-prices.ts";
import { lastFuelPrice } from "../lib/parsing/parse-last-fuel-prices.ts";
import type { StationFuelPrices } from "../types/parser.ts";
import { verifyHash } from "../lib/parsing/verify-hash.ts";

const filePathInput = paths.raw.fuelEntryPointFile;
const datasetDir = paths.raw.fuel;
const outputDir = paths.parsed.fuel;
const manifestPath = paths.manifests.fuel;

export async function parseFuelPricesDataset(
  fuelManifestData: FuelManifest[],
): Promise<void> {
  // Sort by year: each year depends on end-of-year prices of the previous one
  const sortedManifest = [...fuelManifestData].sort(
    (a, b) => Number(a.year) - Number(b.year),
  );

  // Guard against gaps in tears to avoid silently wrong prices
  let prevYear: number | undefined;

  for (const entry of sortedManifest) {
    const year = Number(entry.year);
    if (prevYear !== undefined && year !== prevYear + 1) {
      throw new Error(
        `Gap in fuel manifest: ${String(prevYear)} -> ${String(year)}`,
      );
    }
    prevYear = year;
  }

  // Read fuel prices data from entry point (to have last prices for end of the previous year)
  let previousYearPrices: StationFuelPrices[] = await lastFuelPrice(
    filePathInput,
    PACA_DEPARTMENTS,
  );

  for (const entry of sortedManifest) {
    console.log(`Processing ${entry.fileName}`);
    const filePath = path.join(datasetDir, entry.fileName);

    await verifyHash(filePath, entry.hash);

    const result = await parseWeightedFuelPrices(
      filePath,
      PACA_DEPARTMENTS,
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
  const manifestContent = await fsp.readFile(manifestPath, "utf-8");
  const parsedManifest: unknown = JSON.parse(manifestContent);

  if (!isFuelManifestArray(parsedManifest)) {
    throw new Error("Invalid fuel manifest format");
  }

  await parseFuelPricesDataset(parsedManifest);
}

await main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
