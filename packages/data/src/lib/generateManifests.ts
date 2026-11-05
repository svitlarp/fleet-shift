import path from "node:path";
import fs from "node:fs/promises";
import { generateFileManifest } from "../lib/generate-file-manifest.ts";


/**
 * Generate  a manifest for all files in the given folder by calling generateFileManifest function
 * @param datasetDir Name of dataset folder
 * @returns Manifest - An array of objects with metadata and sha256 hash for every file
 */
export async function generateManifests(datasetDir: string) {
  const fileNames = (await fs.readdir(datasetDir))
    .filter((name) => name.endsWith(".xml"))
    .sort();

  if (fileNames.length === 0) {
    throw new Error(`No XML files in ${datasetDir}`);
  }
  const entries = [];

  for (const fileName of fileNames) {
    entries.push(await generateFileManifest(path.join(datasetDir, fileName)));
    console.log(`ok ${fileName}`);
  }
  return entries;
};