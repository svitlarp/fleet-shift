import path from "node:path";
import fs from "node:fs/promises";
import type { Stats } from "node:fs";
import { calculateFileHash } from "./hash-file.ts";
import type { BaseManifest } from "../types/manifest.ts";


/**
 * Generates metadata for an XML fuel prices file
 * @param value - Absolute path to the XML file
 * @returns An object containing metadata for the fuel prices manifest including Hash to verify the integrity of the source file
 */
export async function generateFileManifest<TMetadata extends object>(
  filePath: string,
  generateMetadata: (fileName: string) => TMetadata | Promise<TMetadata>,
): Promise<BaseManifest & TMetadata> {

  const fileName = path.basename(filePath);
  const stats: Stats = await fs.stat(filePath);
  const hash = await calculateFileHash(filePath);
  const metadata = await generateMetadata(fileName);

  return {
    fileName,
    ...metadata,
    downloadedAt: new Date().toISOString(),
    sizeBytes: stats.size,
    hash,
  };
}

