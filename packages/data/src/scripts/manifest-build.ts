import path from "node:path";
import { projectRoot } from "../lib/path.ts";
import  { generateManifests } from "../lib/generateManifests.ts";
import { writeManifest } from "../lib/writeManifest.ts";
import { generateFuelFileManifest } from "../lib/gen-fuel-file-manifest.ts";
import { generateIRVEFileManifest } from "../lib/gen-irve-file-manifest.ts";
import type { DatasetConfig, FuelManifest, IRVEManifest } from "../types/manifest.ts";


type AnyManifest = FuelManifest | IRVEManifest;

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




