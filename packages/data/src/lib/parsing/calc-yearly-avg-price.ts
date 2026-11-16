import path from "node:path";
import fsp from "node:fs/promises";
import { projectRoot } from "../manifest/path.ts";

interface FuelStation {
  stationID: string;
  cp: string;
  priceE10Avg: number | null;
  priceGazoleAvg: number | null;
}

interface FuelStationsData {
  stations: FuelStation[];
}

interface YearlyAvgFuelPrices {
  priceE10: number;
  priceGazole: number;
  countE10: number;
  countGazole: number;
  avgE10: number | null;
  avgGazole: number | null;
}

interface YearData {
  year: string;
  data: YearlyAvgFuelPrices;
}

type YearlyFuelData = Record<string, YearlyAvgFuelPrices>;

/**
 * Calculates the average fuel prices for all stations in a yearly data file.
 * @param filePath Path to the input file  
 * @returns Object that contains years as a kyes and average fuel prices for all stations for specific year  
 */
export async function calcYearlyAvgPrice(filePath: string): Promise<YearData> {
  const year = filePath.match(/(\d{4})\.json$/i)?.[1];
  // Check if year could be extracted from the file name
  if (!year) {
    throw new Error(`Cannot extract year from filename: ${filePath}`);
  }

  const data = await fsp.readFile(filePath, "utf-8");
  if (!data) {
    throw new Error(`Empty file: ${filePath}`);
  }

  const parsedData: FuelStationsData = JSON.parse(data);

  const totals: YearlyAvgFuelPrices = {
    priceE10: 0,
    priceGazole: 0,
    countE10: 0,
    countGazole: 0,
    avgE10: null,
    avgGazole: null,
  };

  for (const entry of parsedData.stations) {
    if (entry.priceE10Avg !== null) {
      totals.priceE10 += entry.priceE10Avg;
      totals.countE10 += 1;
    }
    if (entry.priceGazoleAvg !== null) {
      totals.priceGazole += entry.priceGazoleAvg;
      totals.countGazole += 1;
    }
  }

  totals.avgE10 =
    totals.countE10 > 0 ? totals.priceE10 / totals.countE10 / 1000 : null;
  totals.avgGazole =
    totals.countGazole > 0
      ? totals.priceGazole / totals.countGazole / 1000
      : null;
  console.log(totals);

  return { year: year, data: totals };
}

export async function processDirData(dirPath: string): Promise<YearlyFuelData> {
  const yearlyFuelData: YearlyFuelData = {};
  const files: string[] = await fsp.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);

    const result = await calcYearlyAvgPrice(filePath);
    yearlyFuelData[result.year] = result.data;
    // yearlyFuelData.push(result);
  }
  return yearlyFuelData;
}

const dirFuelYearlyPath = path.join(projectRoot, "parsed", "fuel-prices");
const fileOutputPath = path.join(projectRoot, "parsed", "yearlyAvg.json");

export async function main() {
  const data = await processDirData(dirFuelYearlyPath);
  const jsonData = JSON.stringify(data, null, 2);
  await fsp.writeFile(fileOutputPath, jsonData, "utf-8");
}

await main().catch(console.error);
