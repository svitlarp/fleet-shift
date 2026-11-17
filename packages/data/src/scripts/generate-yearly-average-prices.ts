import path from "node:path";
import fsp from "node:fs/promises";
import { paths } from "../config/paths.ts";
import type { YearlyFuelData } from "../types/parser.ts";
import { calcYearlyAvgPrice } from "../lib/parsing/calc-yearly-avg-price.ts";

const dirFuelYearlyPath = paths.parsed.fuel;
const fileOutputPath = paths.processed.fuel; //  path.join(dataRoot, "parsed", "yearlyAvg.json");

export async function processDirData(dirPath: string): Promise<YearlyFuelData> {
  const yearlyFuelData: YearlyFuelData = {};
  const files: string[] = await fsp.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);

    const result = await calcYearlyAvgPrice(filePath);
    yearlyFuelData[result.year] = result.data;
  }
  return yearlyFuelData;
}

/**
 * Generates yearly average fuel prices.
 *
 * Steps:
 * 1. Reads all files from parsed/fuel-prices.
 * 2. Calculates yearly average prices using calcYearlyAvgPrice() by aggregating the results by year.
 * 4. Saves the result to parsed/yearlyAvg.json.
 */
export async function main() {
  const data = await processDirData(dirFuelYearlyPath);
  const jsonData = JSON.stringify(data, null, 2);
  await fsp.writeFile(fileOutputPath, jsonData, "utf-8");
}

await main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
