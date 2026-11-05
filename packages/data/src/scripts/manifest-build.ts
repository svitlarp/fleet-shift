import path from "node:path";
import { projectRoot } from "../lib/path.ts";
import  { generateManifests } from "../lib/generateManifests.ts";
import { writeManifest } from "../lib/writeManifest.ts";


const datasets = [
  {
    name: "fuel",
    directory: path.join(projectRoot, "raw/fuel-prices"),
    manifestPath: path.join(projectRoot, "manifests/fuel-manifest.json"),
  },
//   {
//     name: "irve",
//     directory: path.join(projectRoot, "raw/irve"),
//     manifestPath: path.join(projectRoot, "manifests/irve-manifest.json"),
//   },
];

async function main(): Promise<void> {
  for (const dataset of datasets) {
      const manifestContent = await generateManifests(dataset.directory);

      await writeManifest(dataset.manifestPath, manifestContent);
      console.log(`Generated ${dataset.name} manifest`);
  }
}

main().catch((error: unknown) => {
  console.error("Manifests generation failed: ", error);
  process.exitCode = 1;
});
