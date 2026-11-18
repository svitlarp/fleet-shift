import type { EVCatalogManifest } from "../../types/manifest.ts";
import type { EVCatalogSource } from "../../types/ev-catalog-source.ts";
import { generateFileManifest } from "./generate-file-manifest.ts";
import { paths } from "../../config/paths.ts";
import { fetchSourceUpdatedAt } from "../data-gouv.ts";
import { readJson } from "../read-json.ts";

export async function generateEVCatalogFileManifest(
  filePath: string,
): Promise<EVCatalogManifest> {
  const source = await readJson<EVCatalogSource>(paths.sourceUrls.evCatalog);
  const sourceUpdatedAt = await fetchSourceUpdatedAt(
    source.datasetId,
    source.resourceId,
  );

  return generateFileManifest(filePath, () => ({
    sourceURL: source.sourceURL,
    datasetId: source.datasetId,
    resourceId: source.resourceId,
    sourceUpdatedAt,
  }));
}
