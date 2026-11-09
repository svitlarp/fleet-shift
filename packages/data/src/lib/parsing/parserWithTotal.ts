import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import saxes from "saxes";
import { projectRoot } from "../manifest/path.ts";
import { number } from "zod";

// const stationIDs = new Set<string>();
interface StationContent {
  id: string;
  cp: string;
  priceE10Avg: number;
  priceGazoleAvg: number;
}

interface currentStation {
  id: string;
  cp: string;
  priceE10Sum: number;
  priceGazoleSum: number;
  countE10: number;
  countGazole: number;
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
  let stationsArrNoE10: string[] = [];
  let currentStation: currentStation | null = null;

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
          priceE10Sum: 0,
          priceGazoleSum: 0,
          countE10: 0,
          countGazole: 0,
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

    if (fuelName === "E10") {
      currentStation.priceE10Sum += valeur;
      currentStation.countE10 += 1;
    }
    if (fuelName === "Gazole") {
      currentStation.priceGazoleSum += valeur;
      currentStation.countGazole += 1;
    }
  });

  // Close station
  parser.on("closetag", (tag) => {
    if (tag.name === "pdv" && currentStation) {
      const { id, cp, priceE10Sum, priceGazoleSum, countE10, countGazole } =
        currentStation;

      if (currentStation.priceE10Sum === 0 && currentStation.priceGazoleSum > 0) {
        totalNumOfStationsNoE10 += 1;
        stationsArrNoE10.push(currentStation.id);
      }

      stationContent.push({
        id,
        cp,
        priceE10Avg: countE10 > 0 ? priceE10Sum / countE10 / 1000 : null,
        priceGazoleAvg:
          countGazole > 0 ? priceGazoleSum / countGazole / 1000 : null,
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
