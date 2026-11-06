import sourceUrlsJson from "../../../source-urls/irve-source-urls.json" with { type: "json" };
import type { IRVEManifest } from "../../types/manifest.ts";
import type { IRVESource } from "../../types/irve-source.ts";
import { generateFileManifest } from "./generate-file-manifest.ts";


// TODO: improve sourceUrls type
const sourceUrls: IRVESource = sourceUrlsJson;

// TODO: improve sourceUpdatedAt variable -> parse CSV file 
export async function generateIRVEFileManifest(filePath: string): Promise<IRVEManifest> {
  
  return generateFileManifest(filePath, () => ({
    sourceURL: sourceUrls.sourceURL,
    datasetId: sourceUrls.datasetId,
    resourceId: sourceUrls.resourceId,   
    sourceUpdatedAt: sourceUrls.sourceUpdatedAt,
  }));
}
