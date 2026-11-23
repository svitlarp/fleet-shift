import path from "node:path";
import fs from "node:fs/promises";
import { paths } from "../config/paths.ts";
import { parseEVCatalog } from "../lib/parsing/parse-ev-catalog.ts";
import { verifyHash } from "../lib/parsing/verify-hash.ts";
import { readJson } from "../lib/read-json.ts";
import type { EVCatalogManifest } from "../types/manifest.ts";
import type { EVCatalog } from "../types/parser-ev-catalog.ts";

async function main() {
  const [manifest] = await readJson<EVCatalogManifest[]>(
    paths.manifests.evCatalog,
  );
  if (!manifest) throw new Error("EV catalog manifest is empty");

  await verifyHash(paths.raw.evCatalog, manifest.hash);

  const { vehicles, stats } = await parseEVCatalog(paths.raw.evCatalog);
  console.log("EV catalog:", { ...stats, kept: vehicles.length });

  const catalog: EVCatalog = {
    source: {
      name: "ADEME Car Labelling",
      url: manifest.sourceURL,
      sourceUpdatedAt: manifest.sourceUpdatedAt,
      hash: manifest.hash,
    },
    vehicles,
  };

  await fs.mkdir(path.dirname(paths.processed.evCatalog), { recursive: true });
  await fs.writeFile(
    paths.processed.evCatalog,
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf-8",
  );
}

await main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
