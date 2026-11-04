import path from "node:path";
import fs from "node:fs/promises";
import type { Stats } from "node:fs";
import crypto from "node:crypto";
import sourceUrls from "../../source-urls/fuel-source-urls.json" with { type: "json" };
import type { FileManifest } from "../types/manifest.ts";
// import { fuelDir } from "../lib/path.ts";


/**
 * Generates metadata for an XML fuel prices file
 * @param value - Absolute path to the XML file
 * @returns An object containing metadata for the fuel prices manifest
 * including Hash to verify the integrity of the source file
 */
export async function generateManifest(filePath: string): Promise<FileManifest> {
  // Check if the file is in XML format as expected
  if (path.extname(filePath).toLocaleLowerCase() !== ".xml") {
    throw new Error(`Not an XML file: ${filePath}`);
  }

  // Determine the name of the file and the year
  const fileName = path.basename(filePath);
  const yearMatch = fileName.match(/(\d{4}).xml$/);
  if (!yearMatch) {
    throw new Error(`Cannot determine year from filename: ${fileName}`);
  }
  const year = Number(yearMatch[1]);

  // If there are no expected year in sourceURL variable
  if (!(year in sourceUrls)) {
    throw new Error(`Source URL is missing for Year: ${year}`);
  }
  const fuelYear = year as FuelYear;
  const stats: Stats = await fs.stat(filePath);
  const fileContent = await fs.readFile(filePath);
  const hash = crypto.createHash("sha256").update(fileContent).digest("hex");

  const fileData: FileManifest = {
    fileName,
    year: fuelYear,
    sourceURL: sourceUrls[fuelYear],
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
