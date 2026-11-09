import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import saxes from "saxes";
import { projectRoot } from "../manifest/path.ts";

// const stationIDs = new Set<string>();
interface StationContent {
  id: string;
  cp: string;
  priceE10Avg: number | null;
  priceGazoleAvg: number | null;
}

interface currentStation {
  // Station ID from XML file
  id: string;
  //  CodePostal - postal code of the Station
  cp: string;

  // Last known price for E10 / Gazole
  priceE10Sum: number | null;
  priceGazoleSum: number | null;

  // Sum of the products of price and duration
  priceWeightedE10Sum: number;
  priceWeightedGazoleSum: number;

  // Timestamp of the last price update
  timestampE10Sum: number;
  timestampGazoleSum: number;

  // Sum of the products of all timestamps for E10 / Gazole
  totalDurationE10Ms: number;
  totalDurationGazoleMs: number;
}

interface ParseResult {
  stations: StationContent[];
  totalPACAStations: number;
  totalNumOfStationsNoE10: number;
  stationsArrNoE10: Array<string>;
}

// const ALLOWED_CPs = new Set(["01100", "06*", "83*", "84*"]);
const ALLOWED_CPs = ["04", "05", "06", "13", "83", "84"];

const filePath = path.join(
  projectRoot,
  "/raw/fuel-prices/PrixCarburants_annuel_2024.xml",
);
const fileCreate = path.join(
  projectRoot,
  "/src/lib/parsing/stationsIds2024.json",
);

async function parseStation(
  filePath: string,
  alllowedCps: Array<string>,
): Promise<ParseResult> {
  const parser = new saxes.SaxesParser();
  const stationContent: StationContent[] = [];
  let totalPACAStations = 0;
  let totalNumOfStationsNoE10: number = 0;
  const stationsArrNoE10: string[] = [];
  let currentStation: currentStation | null = null;
  // TODO: Scale year variable
  const fileName = path.basename(filePath);
  const year = Number(fileName.match(/(\d{4})\.xml$/i)?.[1]);
  let priceUpdatedTimestampDiff = null;
  let priceWeightedCurrentE10 = 0;
  let priceWeightedCurrentGazole = 0;

  parser.on("opentag", (tag) => {
    // Open a new station
    if (tag.name === "pdv") {
      const id = tag.attributes.id;
      const cp = tag.attributes.cp;
      console.log("id:", id, "cp: ", cp);

      if (id && cp && alllowedCps.some((prefix) => cp.startsWith(prefix))) {
        currentStation = {
          id,
          cp,
          priceWeightedE10Sum: 0,
          priceWeightedGazoleSum: 0,
          timestampE10Sum: Date.UTC(year, 0, 1),
          timestampGazoleSum: Date.UTC(year, 0, 1),
        };
      } else {
        currentStation = null;
      }
      return;
    }

    // Process only prices of station
    if (tag.name !== "prix" || !currentStation) return;

    const fuelName = tag.attributes.nom;
    const valeur = Number(tag.attributes.valeur);

    // Extract the price update date and convert it to a timestamp
    const maj = tag.attributes.maj;
    if (!maj) return;
    const currentPriceTimestamp = Date.parse(maj); // timestamp like "2015-01-03T11:01:38" of date like "2015-01-03T11:01:38"

    if (fuelName === "E10") {
      // currentStation.countE10 += 1;
      priceUpdatedTimestampDiff = currentPriceTimestamp - currentStation.timestampE10Sum;
      priceWeightedCurrentE10 = valeur * priceUpdatedTimestampDiff;
      currentStation.priceWeightedE10Sum += priceWeightedCurrentE10;
      timestampE10Sum += priceUpdatedTimestampDiff;
      currentStation.timestampE10 = currentPriceTimestamp;
    }
    if (fuelName === "Gazole") {
      // currentStation.countGazole += 1;
      priceUpdatedTimestampDiff = currentPriceTimestamp - currentStation.timestampGazoleSum;
      priceWeightedCurrentGazole = valeur * priceUpdatedTimestampDiff;
      currentStation.priceWeightedGazoleSum += priceWeightedCurrentGazole;
      timestampGazoleSum += priceUpdatedTimestampDiff;
      currentStation.timestampGazole = currentPriceTimestamp;
    }
  });

  // Close station
  parser.on("closetag", (tag) => {
    if (tag.name === "pdv" && currentStation) {
      const { id, cp, priceWeightedE10Sum, priceWeightedGazoleSum, timestampE10Sum, timestampGazoleSum } =
        currentStation;

      if (currentStation.priceWeightedE10Sum === 0 && currentStation.priceWeightedGazoleSum > 0) {
        totalNumOfStationsNoE10 += 1;
        stationsArrNoE10.push(currentStation.id);
      }

      stationContent.push({
        id,
        cp,
        priceE10Avg: timestampE10Sum > 0 ? priceWeightedE10Sum / timestampE10Sum / 1000 : null,
        priceGazoleAvg:
          timestampGazoleSum > 0 ? priceWeightedGazoleSum / timestampGazoleSum / 1000 : null,
      });

      totalPACAStations += 1;

      currentStation = null;
    }
  });

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

  return {
    stations: stationContent,
    totalPACAStations,
    totalNumOfStationsNoE10,
    stationsArrNoE10,
  };
}

async function main() {
  const content = await parseStation(filePath, ALLOWED_CPs);
  await fsp.writeFile(fileCreate, JSON.stringify(content, null, 2), "utf-8");

  // console.log("content size: ", content.length);
  console.log("Total PACA stations: ", content.totalPACAStations);
  console.log(
    "Total PACA stations with No E10: ",
    content.totalNumOfStationsNoE10,
  );
  console.log("Stations PACA with no E10 IDs: ", content.stationsArrNoE10);
}

main().catch(console.error);
