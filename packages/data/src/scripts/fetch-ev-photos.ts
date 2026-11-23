import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { evModelDetailsSchema } from "@fleetshift/core";
import type { EvModelDetails } from "@fleetshift/core";
import { z } from "zod";
import { paths } from "../config/paths.ts";
import { isAllowedLicense, isJpeg, plainAuthor } from "../lib/commons-photo.ts";

const API_URL = "https://commons.wikimedia.org/w/api.php";
const HEADERS = { "User-Agent": "FleetShift-dev/0.1 (diploma project)" };
const THUMB_WIDTH_PX = 960;
const BATCH_SIZE = 20;
const REQUEST_GAP_MS = 2500;
const MAX_ATTEMPTS = 2;

const metadataValue = z.object({ value: z.string() }).optional();
const responseSchema = z.object({
  query: z.object({
    pages: z.record(
      z.string(),
      z.object({
        title: z.string(),
        imageinfo: z
          .array(
            z.object({
              thumburl: z.url(),
              descriptionurl: z.url(),
              extmetadata: z.object({
                LicenseShortName: metadataValue,
                LicenseUrl: metadataValue,
                Artist: metadataValue,
              }),
            }),
          )
          .optional(),
      }),
    ),
    normalized: z
      .array(z.object({ from: z.string(), to: z.string() }))
      .optional(),
  }),
});

async function fetchWithBackoff(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers: HEADERS });
    if (response.ok) return response;
    if (response.status !== 429 || attempt === MAX_ATTEMPTS) {
      throw new Error(`Request failed (${String(response.status)}): ${url}`);
    }
    const retryAfterSeconds = Number(response.headers.get("retry-after")) || 0;
    await delay(Math.min(Math.max(retryAfterSeconds, 10), 30) * 1000);
  }
}

async function fetchImageInfo(titles: string[]) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(THUMB_WIDTH_PX),
    titles: titles.join("|"),
  });
  const response = await fetchWithBackoff(`${API_URL}?${params.toString()}`);
  const { query } = responseSchema.parse(await response.json());
  const canonical = new Map(query.normalized?.map((n) => [n.from, n.to]));
  const byTitle = new Map(
    Object.values(query.pages).map((page) => [page.title, page]),
  );
  return (title: string) => byTitle.get(canonical.get(title) ?? title);
}

async function main() {
  const selection = z
    .record(z.string(), z.string())
    .parse(
      JSON.parse(await fs.readFile(paths.catalog.evPhotoSelection, "utf-8")),
    );
  await fs.mkdir(paths.catalog.webCarPhotos, { recursive: true });
  const entries = Object.entries(selection);
  const details: EvModelDetails = {};

  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const batch = entries.slice(start, start + BATCH_SIZE);
    const lookup = await fetchImageInfo(batch.map(([, title]) => title)).catch(
      () => null,
    );
    await delay(REQUEST_GAP_MS);

    for (const [modelKey, title] of batch) {
      try {
        const info = lookup?.(title)?.imageinfo?.[0];
        const license = info?.extmetadata.LicenseShortName?.value ?? "";
        if (!info || !isAllowedLicense(license)) {
          throw new Error("no openly licensed image");
        }
        const file = `${modelKey}.jpg`;
        const image = await fetchWithBackoff(info.thumburl);
        const bytes = new Uint8Array(await image.arrayBuffer());
        if (!isJpeg(bytes)) throw new Error("not a JPEG");
        await fs.writeFile(path.join(paths.catalog.webCarPhotos, file), bytes);
        details[modelKey] = {
          photo: {
            file,
            title,
            author: plainAuthor(info.extmetadata.Artist?.value),
            license,
            licenseUrl: info.extmetadata.LicenseUrl?.value ?? null,
            sourceUrl: info.descriptionurl,
          },
        };
        console.log(`Saved ${file}`);
      } catch (error) {
        details[modelKey] = { photo: null };
        console.log(`Placeholder for ${modelKey}: ${String(error)}`);
      }
      await delay(REQUEST_GAP_MS);
    }
  }

  await fs.writeFile(
    paths.catalog.evModelDetails,
    `${JSON.stringify(evModelDetailsSchema.parse(details), null, 2)}\n`,
    "utf-8",
  );
}

await main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
