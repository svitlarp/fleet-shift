import type { FuelYear } from "./fuel-year.ts";

export interface FileManifest {
    fileName: string;
    year: FuelYear;
    sourceURL: string;
    downloadedAt: string;
    sizeBytes: number;
    hash: string;
}