import sourceUrlsJson from "../../../source-urls/ev-catalog-source-urls.json" with { type: "json" };
import type { EVCatalogManifest } from "../../types/manifest.ts";
import type { EVCatalogSource } from "../../types/ev-catalog-source.ts";
import { generateFileManifest } from "./generate-file-manifest.ts";

const sourceUrls: EVCatalogSource = sourceUrlsJson;

// TODO: improve sourceUpdatedAt variable -> parse CSV file 
export async function generateEVCatalogFileManifest(filePath: string): Promise<EVCatalogManifest> {
  
  return generateFileManifest(filePath, () => ({
    sourceURL: sourceUrls.sourceURL,
    sourceUpdatedAt: sourceUrls.sourceUpdatedAt,
  }));
}