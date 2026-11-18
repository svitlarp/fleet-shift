import type { IRVEManifest } from "../../types/manifest.ts";
import type { IRVESource } from "../../types/irve-source.ts";
import { generateFileManifest } from "./generate-file-manifest.ts";
import { paths } from "../../config/paths.ts";
import { fetchSourceUpdatedAt } from "../data-gouv.ts";
import { readJson } from "../read-json.ts";

export async function generateIRVEFileManifest(
  filePath: string,
): Promise<IRVEManifest> {
  const source = await readJson<IRVESource>(paths.sourceUrls.irve);
  const sourceUpdatedAt = await fetchSourceUpdatedAt(
    source.datasetId,
    source.resourceId
  );

  return generateFileManifest(filePath, () => ({
    sourceURL: source.sourceURL,
    datasetId: source.datasetId,
    resourceId: source.resourceId,
    sourceUpdatedAt,
  }));
}


