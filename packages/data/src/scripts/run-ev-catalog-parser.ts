import path from "node:path";
import fs from "node:fs/promises";
import { paths } from "../config/paths.ts";
import { parseEVCatalog } from "../lib/parsing/parse-ev-catalog.ts";
import { verifyHash } from "../lib/parsing/verify-hash.ts";
import { readJson } from "../lib/read-json.ts";
import type { EVCatalogManifest } from "../types/manifest.ts";



async function main() {
    const [manifest] = await readJson<EVCatalogManifest[]>(paths.manifests.evCatalog);
    if (!manifest) throw new Error("IRVE manifest is empty");

    await verifyHash(paths.raw.evCatalog, manifest.hash);

    const result = await parseEVCatalog(paths.raw.evCatalog);

    await fs.mkdir(path.dirname(paths.processed.evCatalog), { recursive: true });
    await fs.writeFile(
    paths.processed.evCatalog,
    JSON.stringify(result, null, 2),
    "utf-8",
    );
}

await main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});


