import sourceUrls from "../../../source-urls/fuel-source-urls.json" with { type: "json" };
import type { FuelManifest } from "../../types/manifest.ts";
import type { FuelYear } from "../../types/fuel-year.ts";
import { generateFileManifest } from "./generate-file-manifest.ts";

/**
 * Generates metadata for an XML fuel prices file
 * @param value - Absolute path to the XML file
 * @returns An object containing metadata for the fuel prices manifest including Hash to verify the integrity of the source file
 */
export async function generateFuelFileManifest(
  filePath: string,
): Promise<FuelManifest> {
  return generateFileManifest(filePath, (fileName) => {
    const year = fileName.match(/(\d{4})\.xml$/i)?.[1];

    // Check if year could be extracted from the file name
    if (!year) {
      throw new Error(`Cannot extract year from filename: ${fileName}`);
    }

    const fuelYear = year as FuelYear;
    const sourceURL = sourceUrls[fuelYear];

    if (!sourceURL) {
      throw new Error(`No source URL found for year: ${fuelYear}`);
    }

    return {
      year: fuelYear,
      sourceURL,
    };
  });
}
