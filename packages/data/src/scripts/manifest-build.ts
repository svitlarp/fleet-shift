import { paths } from "../config/paths.ts";
import { generateManifests } from "../lib/manifest/generateManifests.ts";
import { writeManifest } from "../lib/manifest/writeManifest.ts";
import { generateFuelFileManifest } from "../lib/manifest/gen-fuel-file-manifest.ts";
import { generateIRVEFileManifest } from "../lib/manifest/gen-irve-file-manifest.ts";
import type {
  DatasetConfig,
  EVCatalogManifest,
  FuelManifest,
  IRVEManifest,
} from "../types/manifest.ts";
import { generateEVCatalogFileManifest } from "../lib/manifest/gen-ev-catalog-manifest.ts";

type AnyManifest = FuelManifest | IRVEManifest | EVCatalogManifest;

const datasets: DatasetConfig<AnyManifest>[] = [
  {
    name: "fuel",
    directory: paths.raw.fuel,
    manifestPath: paths.manifests.fuel,
    generator: generateFuelFileManifest,
  },
  {
    name: "irve",
    directory: paths.raw.irve,
    manifestPath: paths.manifests.irve,
    generator: generateIRVEFileManifest,
  },
  {
    name: "ev-catalog",
    directory: paths.raw.evCatalog,
    manifestPath: paths.manifests.evCatalog,
    generator: generateEVCatalogFileManifest,
  },
];

async function main(): Promise<void> {
  for (const dataset of datasets) {
    const manifestContent = await generateManifests<AnyManifest>(
      dataset.directory,
      dataset.generator,
    );

    await writeManifest(dataset.manifestPath, manifestContent);

    console.log(`Generated ${dataset.name} manifest`);
  }
}

main().catch((error: unknown) => {
  console.error("Manifests generation failed: ", error);
  process.exitCode = 1;
});
