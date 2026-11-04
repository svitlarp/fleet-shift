export interface FileManifest {
    fileName: string;
    year: FuelYear;
    sourceURL: string;
    downloadedAt: string;
    sizeBytes: number;
    hash: string;
}