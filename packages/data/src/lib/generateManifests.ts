import path from "node:path";
import fs from "node:fs/promises";
import type { ManifestGenerator } from "../types/manifest.ts";


/**
 * Generate  a manifest for all files in the given folder by calling generateFileManifest function
 * @param datasetDir Name of dataset folder
 * @returns Manifest - An array of objects with metadata and sha256 hash for every file
 */
export async function generateManifests<T>(
  datasetDir: string,
  generator: ManifestGenerator<T>
): Promise<T[]> {
  const fileNames = (await fs.readdir(datasetDir)).sort();

  if (fileNames.length === 0) {
    throw new Error(`No files in ${datasetDir}`);
  }
  const entries: T[] = [];

  for (const fileName of fileNames) {
    const filePath = path.join(datasetDir, fileName)
    entries.push(await generator(filePath));

    console.log(`ok ${fileName}`);
  }
  return entries;
};