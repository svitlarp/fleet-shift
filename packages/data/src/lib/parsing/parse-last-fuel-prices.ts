import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { SaxesParser } from "saxes";
import { projectRoot } from "../manifest/path.ts";
import { normalizePrice } from "../data-normalisation.ts";

const ALLOWED_CPs = ["04", "05", "06", "13", "83", "84"];

export interface LastFuelPrice {
  stationID: string;
  cp: string;
  priceE10: number | null;
  priceGazole: number | null;
  timestampE10: number | null;
  timestampGazole: number | null;
}

interface CurrentStation {
  id: string;
  cp: string;
  priceE10: number | null;
  priceGazole: number | null;
  timestampE10: number | null;
  timestampGazole: number | null;
}

export async function lastFuelPrice(
  filePath: string,
  alllowedCps: Array<string>,
): Promise<LastFuelPrice[]> {
  const parser = new SaxesParser();
  const lastFuelPricesArr: LastFuelPrice[] = [];
  let currentStation: CurrentStation | null = null;

  parser.on("opentag", (tag) => {
    if (tag.name === "pdv") {
      const id = tag.attributes.id;
      const cp = tag.attributes.cp;

      if (id && cp && alllowedCps.some((prefix) => cp.startsWith(prefix))) {
        currentStation = {
          id,
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
      const { id, cp, priceE10, priceGazole, timestampE10, timestampGazole } =
        currentStation;

      lastFuelPricesArr.push({
        stationID: id,
        cp,
        priceE10,
        priceGazole,
        timestampE10,
        timestampGazole,
      });
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

const filePathInput = path.join(
  projectRoot,
  "/raw/fuel-prices/entry-point/PrixCarburants_annuel_2015.xml",
);
const filePathOutput = path.join(
  projectRoot,
  "/parsed/normalisedLastFuelPriceFor_2015.json",
);

async function main() {
  const fileContent = await lastFuelPrice(filePathInput, ALLOWED_CPs);
  await fsp.writeFile(
    filePathOutput,
    JSON.stringify(fileContent, null, 2),
    "utf-8",
  );
  console.log();
}

main().catch(console.error);
