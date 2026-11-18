import fsp from "node:fs/promises";
import { generateFuelFileManifest } from "../lib/manifest/gen-fuel-file-manifest.ts";
import { paths } from "../config/paths.ts";

const entryPointFileManifest = await generateFuelFileManifest(
  paths.raw.fuelEntryPointFile,
);

await fsp.writeFile(
  paths.manifests.fuelEntryPoint,
  JSON.stringify(entryPointFileManifest, null, 2),
  "utf-8",
);

console.log(`Generated ${paths.raw.fuelEntryPointFile} manifest`);