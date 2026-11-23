import fs from "node:fs/promises";
import { paths } from "../config/paths.ts";
import { parseIceReference } from "../lib/parsing/parse-ice-reference.ts";
import { verifyHash } from "../lib/parsing/verify-hash.ts";
import { readJson } from "../lib/read-json.ts";
import type { EVCatalogManifest } from "../types/manifest.ts";

async function main() {
  const [manifest] = await readJson<EVCatalogManifest[]>(
    paths.manifests.evCatalog,
  );
  if (!manifest) throw new Error("EV catalog manifest is empty");
  await verifyHash(paths.raw.evCatalog, manifest.hash);

  const entries = await parseIceReference(paths.raw.evCatalog);
  console.log(`ICE reference entries: ${String(entries.length)}`);
  await fs.writeFile(
    paths.processed.iceReference,
    `${JSON.stringify(entries, null, 2)}\n`,
    "utf-8",
  );
}

await main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
