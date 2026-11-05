import path from "node:path";
import fs from "node:fs/promises";
import type { Stats } from "node:fs";
import { calculateFileHash } from "./hash-file.ts";
import sourceUrls from "../../source-urls/fuel-source-urls.json" with { type: "json" };
import type { FileManifest } from "../types/manifest.ts";
import type { FuelYear } from "../types/fuel-year.ts";
import { fuelDir } from "../lib/path.ts";


/**
 * Check whether the given year exists in the source URLs
 * @param year: Year extracted from the file name
 * @returns True if the year is a valid key in sourceUrls
 */
function isFuelYear(year: string): year is FuelYear {
  return year in sourceUrls;
}

/**
 * Generates metadata for an XML fuel prices file
 * @param value - Absolute path to the XML file
 * @returns An object containing metadata for the fuel prices manifest
 * including Hash to verify the integrity of the source file
 */
export async function generateFileManifest(filePath: string): Promise<FileManifest> {
  // Check if the file is in XML format as expected
  if (path.extname(filePath).toLowerCase() !== ".xml") {
    throw new Error(`Not an XML file: ${filePath}`);
  }

  // TODO extract chunks that rilated only to specific dataset to have a clean function that can apply to any dataset 
  // Extract the file name from the file path 
  const fileName = path.basename(filePath);
  const year = fileName.match(/(\d{4})\.xml$/i)?.[1];

  // Check if year could be extracted from the file name
  if (!year) {
    throw new Error(`Cannot extract year from filename: ${fileName}`);
  }

  // Check whether a source URL exists for the extracted year
  if (!isFuelYear(year)) {
    throw new Error(`Source URL is missing for Year: ${year}`);
  }
  const stats: Stats = await fs.stat(filePath);
  const hash = await calculateFileHash(filePath);
  
  const fileData: FileManifest = {
    fileName,
    year,
    sourceURL: sourceUrls[year],
    downloadedAt: new Date().toISOString(),
    sizeBytes: stats.size,
    hash,
  };

  console.log(fileData);
  return fileData;
}


// Check creation of metadata with 1 file
// const filePath = path.join(fuelDir, "PrixCarburants_annuel_2022.xml")
// generateManifest(filePath).catch((error: unknown) => {
//   console.log("Manifest generation failed: ", error);
//   process.exitCode = 1;
// });
