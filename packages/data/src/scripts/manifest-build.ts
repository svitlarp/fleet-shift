import path from "node:path";
import { projectRoot } from "../lib/manifest/path.ts";
import  { generateManifests } from "../lib/manifest/generateManifests.ts";
import { writeManifest } from "../lib/manifest/writeManifest.ts";
import { generateFuelFileManifest } from "../lib/manifest/gen-fuel-file-manifest.ts";
import { generateIRVEFileManifest } from "../lib/manifest/gen-irve-file-manifest.ts";
import type { DatasetConfig, EVCatalogManifest, FuelManifest, IRVEManifest } from "../types/manifest.ts";
import { generateEVCatalogFileManifest } from "../lib/manifest/gen-ev-catalog-manifest.ts";


type AnyManifest = FuelManifest | IRVEManifest | EVCatalogManifest;

const datasets: DatasetConfig<AnyManifest>[] = [
  {
    name: "fuel",
    directory: path.join(projectRoot, "raw/fuel-prices"),
    manifestPath: path.join(projectRoot, "manifests/fuel-manifest.json"),
    generator: generateFuelFileManifest,
  },
  {
    name: "irve",
    directory: path.join(projectRoot, "raw/irve"),
    manifestPath: path.join(projectRoot, "manifests/irve-manifest.json"),
    generator: generateIRVEFileManifest,
  },
  {
    name: "ev-catalog",
    directory: path.join(projectRoot, "raw/ev-catalog"),
    manifestPath: path.join(projectRoot, "manifests/ev-catalog-manifest.json"),
    generator: generateEVCatalogFileManifest,
  }
];

async function main(): Promise<void> {
  for (const dataset of datasets) {
      const manifestContent = await generateManifests<AnyManifest>(
        dataset.directory, 
        dataset.generator
      );

      await writeManifest(dataset.manifestPath, manifestContent);

      console.log(`Generated ${dataset.name} manifest`);
  }
}

main().catch((error: unknown) => {
  console.error("Manifests generation failed: ", error);
  process.exitCode = 1;
});




