import fsp from "node:fs/promises";
import fs from "node:fs";
import { paths } from "../../config/paths.ts";
import { PACA_DEPARTMENTS } from "../../config/regions.ts";
import { SaxesParser } from "saxes";
import { normalizePrice } from "../data-normalisation.ts";
import type { StationFuelPrices } from "../../types/parser.ts";

const filePathInput = paths.raw.fuelEntryPointFile;
const filePathOutput = paths.parsed.fuelEntryPointFile;

export async function lastFuelPrice(
  filePath: string,
  allowedCps: typeof PACA_DEPARTMENTS,
): Promise<StationFuelPrices[]> {
  const parser = new SaxesParser();
  const lastFuelPricesArr: StationFuelPrices[] = [];
  let currentStation: StationFuelPrices | null = null;

  parser.on("opentag", (tag) => {
    if (tag.name === "pdv") {
      const id = tag.attributes.id;
      const cp = tag.attributes.cp;

      if (id && cp && allowedCps.some((prefix) => cp.startsWith(prefix))) {
        currentStation = {
          stationID: id,
          cp,
          priceE10: null,
          priceGazole: null,
          timestampE10: null,
          timestampGazole: null,
        };
      } else {
        currentStation = null;
      }
      return;
    }

    if (tag.name !== "prix" || !currentStation) return;
    const fuelName = tag.attributes.nom;
    let price = Number(tag.attributes.valeur);
    // Check if the price is a float number and should be normalised
    if (!Number.isInteger(price)) {
      price = normalizePrice(price, 1000);
    }
    const date = tag.attributes.maj;
    if (!date) return;
    const timestamp = Date.parse(date);

    if (fuelName === "E10") {
      currentStation.priceE10 = price;
      currentStation.timestampE10 = timestamp;
    }
    if (fuelName === "Gazole") {
      currentStation.priceGazole = price;
      currentStation.timestampGazole = timestamp;
    }
  });

  parser.on("closetag", (tag) => {
    if (tag.name === "pdv" && currentStation) {
      lastFuelPricesArr.push(currentStation);
      currentStation = null;
    }
  });

  // Last part: Create Stream -> write chunk of stream, close parser
  const stream = fs.createReadStream(filePath, {
    encoding: "utf-8",
  });

  for await (const chunk of stream) {
    if (typeof chunk !== "string") {
      throw new Error("Expected a string chunk");
    }
    parser.write(chunk);
  }

  parser.close();

  return lastFuelPricesArr;
}

async function main() {
  const fileContent = await lastFuelPrice(filePathInput, PACA_DEPARTMENTS);
  await fsp.writeFile(
    filePathOutput,
    JSON.stringify(fileContent, null, 2),
    "utf-8",
  );
}

main().catch(console.error);
