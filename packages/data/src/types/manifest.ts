import type { FuelYear } from "./fuel-year.ts";

export type ManifestGenerator<T> = (filePath: string) => Promise<T>;

export type DatasetConfig<T> = {
  name: string;
  directory: string;
  manifestPath: string;
  generator: ManifestGenerator<T>;
}

export interface BaseManifest {
    fileName: string;
    downloadedAt: string;
    sizeBytes: number;
    hash: string;
}

export interface FuelManifest extends BaseManifest {
    year: FuelYear;
    sourceURL: string;
}

export interface IRVEManifest extends BaseManifest {
    sourceURL: string;
    datasetId: string;
    resourceId: string;
    sourceUpdatedAt: string;
}

export interface EVCatalogManifest extends BaseManifest {
    sourceURL: string;
    sourceUpdatedAt: string;
}
