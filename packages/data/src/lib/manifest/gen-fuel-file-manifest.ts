import type { FuelManifest } from "../../types/manifest.ts";
import type { FuelYear } from "../../types/fuel-year.ts";
import type { FuelSourceUrls } from "../../types/fuel-sources.ts";
import { paths } from "../../config/paths.ts";
import { generateFileManifest } from "./generate-file-manifest.ts";
import { fetchLastModifiedHeader } from "../http-last-modified.ts";
import { readJson } from "../read-json.ts";

function isFuelYear(urls: FuelSourceUrls, year: string): year is FuelYear {
  return Object.hasOwn(urls, year);
}

/**
 * Generates metadata for an XML fuel prices file
 * @param value - Absolute path to the XML file
 * @returns An object containing metadata for the fuel prices manifest including Hash to verify the integrity of the source file
 */
export async function generateFuelFileManifest(
  filePath: string,
): Promise<FuelManifest> {
  const urls = await readJson<FuelSourceUrls>(paths.sourceUrls.fuel);

  return generateFileManifest(filePath, async(fileName) => {
    const year = fileName.match(/(\d{4})\.xml$/i)?.[1];

    // Check if year could be extracted from the file name
    if (!year) {
      throw new Error(`Cannot extract year from filename: ${fileName}`);
    }
    if (!isFuelYear(urls, year)) {
      throw new Error(`No source URL found for year: ${year}`);
    }
    const sourceURL = urls[year];
    const sourceUpdatedAt = await fetchLastModifiedHeader(sourceURL);

    return {
      year,
      sourceURL,
      sourceUpdatedAt,
    };
  });
}
