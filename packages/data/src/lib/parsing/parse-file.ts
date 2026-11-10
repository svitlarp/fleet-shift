import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import saxes from "saxes";
import { projectRoot } from "../manifest/path.ts";


interface StationContent {
  id: string;
  cp: string;
  priceE10Avg: number | null;
  priceGazoleAvg: number | null;
}

interface CurrentStation {
  // Station ID from XML file
  id: string;
  //  CodePostal - postal code of the Station
  cp: string;

  // Last known price for E10 / Gazole
  priceE10: number | null;
  priceGazole: number | null;

  // Sum of the products of price and duration
  priceWeightedE10Sum: number;
  priceWeightedGazoleSum: number;

  // Timestamp of the last price update
  timestampE10: number;
  timestampGazole: number;

  // Sum of the products of all timestamps for E10 / Gazole
  totalDurationE10Ms: number;
  totalDurationGazoleMs: number;
}

interface ParseResult {
  stations: StationContent[];
  totalPACAStations: number;
  totalStationsWithoutE10: number;
  stationIdsWithoutE10: Array<string>;
}

// const ALLOWED_CPs = ["04", "05", "06", "13", "83", "84"];

const rawDataFilePath = path.join(
  projectRoot,
  "/raw/fuel-prices/PrixCarburants_annuel_2024.xml",
);
const processedDataFilePath = path.join(
  projectRoot,
  "/src/lib/parsing/fuel-weighted-prices2024.json",
);

export async function parseStations(
  filePath: string,
  alllowedCps: Array<string>,
): Promise<ParseResult> {
  const parser = new saxes.SaxesParser();
  const stationContent: StationContent[] = [];
  let currentStation: CurrentStation | null = null;
  let totalPACAStations: number = 0;
  let totalStationsWithoutE10: number = 0;
  const stationIdsWithoutE10: Array<string> = [];

  const fileName = path.basename(filePath);
  const year = Number(fileName.match(/(\d{4})\.xml$/i)?.[1]);

  parser.on("opentag", (tag) => {
    if (tag.name === "pdv") {
      const id = tag.attributes.id;
      const cp = tag.attributes.cp;
      console.log("id:", id, "cp: ", cp);

      if (id && cp && alllowedCps.some((prefix) => cp.startsWith(prefix))) {
        currentStation = {
          id,
          cp,
          priceE10: null,
          priceGazole: null,
          priceWeightedE10Sum: 0,
          priceWeightedGazoleSum: 0,
          timestampE10: Date.UTC(year, 0, 1),
          timestampGazole: Date.UTC(year, 0, 1),
          totalDurationE10Ms: 0,
          totalDurationGazoleMs: 0,
        };
      } else {
        currentStation = null;
      }
      return;
    }

    // Process only prices of station
    if (tag.name !== "prix" || !currentStation) return;

    const fuelName = tag.attributes.nom;
    const price = Number(tag.attributes.valeur);
    const date = tag.attributes.maj;
    if (!date) return;
    const timestamp = Date.parse(date);

    if (fuelName === "E10") {
      const duration = timestamp - currentStation.timestampE10; // Weight for the price: difference beetwen timestamp of current price and previous price

      if (currentStation.priceE10 !== null && duration > 0) {
        currentStation.priceWeightedE10Sum +=
          currentStation.priceE10 * duration;
        currentStation.totalDurationE10Ms += duration;
      }
      currentStation.priceE10 = price;
      currentStation.timestampE10 = timestamp;
    }

    if (fuelName === "Gazole") {
      const duration = timestamp - currentStation.timestampGazole; // Weight for the price: difference beetwen timestamp of current price and previous price

      if (currentStation.priceGazole !== null && duration > 0) {
        currentStation.priceWeightedGazoleSum +=
          currentStation.priceGazole * duration;
        currentStation.totalDurationGazoleMs += duration;
      }
      currentStation.priceGazole = price;
      currentStation.timestampGazole = timestamp;
    }
  });

  // Close station
  parser.on("closetag", (tag) => {
    if (tag.name === "pdv" && currentStation) {
      const {
        id,
        cp,
        priceE10,
        priceGazole,
        priceWeightedE10Sum,
        priceWeightedGazoleSum,
        totalDurationE10Ms,
        totalDurationGazoleMs,
      } = currentStation;

      if (priceE10 === null && priceGazole !== null) {
        totalStationsWithoutE10++;
        stationIdsWithoutE10.push(id);
      }
      stationContent.push({
        id,
        cp,
        priceE10Avg:
          totalDurationE10Ms > 0
            ? (priceWeightedE10Sum / totalDurationE10Ms).toFixed(3) 
            : null,
        priceGazoleAvg:
          totalDurationGazoleMs > 0
            ? (priceWeightedGazoleSum / totalDurationGazoleMs).toFixed(3) 
            : null,
      });

      totalPACAStations += 1;

      currentStation = null;
    }
  });

  // Last part: Create Strem -> write chunk of stream, close parser
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
    totalStationsWithoutE10,
    stationIdsWithoutE10,
  };
}

// __________



// __________
// async function main() {
//   const fileContent = await parseStations(rawDataFilePath, ALLOWED_CPs);
//   await fsp.writeFile(
//     processedDataFilePath,
//     JSON.stringify(fileContent, null, 2),
//     "utf-8",
//   );

//   console.log("Total PACA stations: ", fileContent.totalPACAStations);
//   console.log(
//     "Total PACA stations without E10: ",
//     fileContent.totalStationsWithoutE10,
//   );
//   console.log(
//     "Stations PACA IDs without E10: ",
//     fileContent.stationIdsWithoutE10,
//   );
// }

// await main().catch(console.error);
