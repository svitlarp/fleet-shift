import path from "node:path";
import fs from "node:fs/promises";
import { paths } from "../config/paths.ts";
import { PACA_DEPARTMENTS } from "../config/regions.ts";
import { parseIRVE } from "../lib/parsing/parse-irve-stations.ts";
import { verifyHash } from "../lib/parsing/verify-hash.ts";
import { readJson } from "../lib/read-json.ts";
import type { IRVEManifest } from "../types/manifest.ts";

async function main() {
  const [manifest] = await readJson<IRVEManifest[]>(paths.manifests.irve);
  if (!manifest) throw new Error("IRVE manifest is empty");

  await verifyHash(paths.raw.irve, manifest.hash);

  const result = await parseIRVE(paths.raw.irve, PACA_DEPARTMENTS);

  await fs.mkdir(path.dirname(paths.processed.irve), { recursive: true });
  await fs.writeFile(
    paths.processed.irve,
    JSON.stringify(result, null, 2),
    "utf-8",
  );
}

await main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
