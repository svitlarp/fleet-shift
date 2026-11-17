import fs from "node:fs";
import path from "node:path";
import saxes from "saxes";
import { normalizePrice } from "../data-normalisation.ts";
import type {
  StationFuelPrices,
  CurrentStation,
  ParseResult,
  StationAvgPrices,
} from "../../types/parser.ts";
import { PACA_DEPARTMENTS } from "../../config/regions.ts";

export async function parseWeightedFuelPrices(
  filePath: string,
  alllowedCps: typeof PACA_DEPARTMENTS,
  lastFuelPriceData: StationFuelPrices[],
): Promise<ParseResult> {
  const parser = new saxes.SaxesParser();
  const stationContent: StationAvgPrices[] = [];
  let currentStation: CurrentStation | null = null;
  let totalPACAStations: number = 0;
  let totalStationsWithoutE10: number = 0;
  const stationIdsWithoutE10: Array<string> = [];
  const fileName = path.basename(filePath);
  const year = Number(fileName.match(/(\d{4})\.xml$/i)?.[1]);
  const endOfYearPrices: StationFuelPrices[] = [];

  const previousPricesMap = new Map(
    lastFuelPriceData.map((station) => [station.stationID, station]),
  );

  parser.on("opentag", (tag) => {
    if (tag.name === "pdv") {
      const id = tag.attributes.id;
      const cp = tag.attributes.cp;
      console.log("id:", id, "cp: ", cp);

      if (id && cp && alllowedCps.some((prefix) => cp.startsWith(prefix))) {
        // Get the previous station object from lastFuelPriceData by matching stationID with the current XML station id.
        const previousPrices = previousPricesMap.get(id);

        currentStation = {
          stationID: id,
          cp,
          priceE10: previousPrices?.priceE10 ?? null,
          priceGazole: previousPrices?.priceGazole ?? null,
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
    let price = Number(tag.attributes.valeur);
    // Check if the price is a float number and should be normalised
    if (!Number.isInteger(price)) {
      price = normalizePrice(price, 1000);
    }
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
      // Handle price from the last updated date till end of the year 31 Decembre);
      const yearEnd = Date.UTC(year + 1, 0, 1);
      const durationE10 = yearEnd - currentStation.timestampE10;
      if (currentStation.priceE10 !== null && durationE10 > 0) {
        currentStation.priceWeightedE10Sum +=
          currentStation.priceE10 * durationE10;
        currentStation.totalDurationE10Ms += durationE10;
      }

      const durationGazole = yearEnd - currentStation.timestampGazole;
      if (currentStation.priceGazole !== null && durationGazole > 0) {
        currentStation.priceWeightedGazoleSum +=
          currentStation.priceGazole * durationGazole;
        currentStation.totalDurationGazoleMs += durationGazole;
      }

      const {
        stationID,
        cp,
        priceE10,
        priceGazole,
        priceWeightedE10Sum,
        priceWeightedGazoleSum,
        timestampE10,
        timestampGazole,
        totalDurationE10Ms,
        totalDurationGazoleMs,
      } = currentStation;

      // Handle prices of the end of hte year to transfer these prices to the beggining of the next year
      endOfYearPrices.push({
        stationID,
        cp,
        priceE10,
        priceGazole,
        timestampE10,
        timestampGazole,
      });

      if (priceE10 === null && priceGazole !== null) {
        totalStationsWithoutE10++;
        stationIdsWithoutE10.push(stationID);
      }
      stationContent.push({
        stationID,
        cp,
        priceE10Avg:
          totalDurationE10Ms > 0
            ? priceWeightedE10Sum / totalDurationE10Ms
            : null,
        priceGazoleAvg:
          totalDurationGazoleMs > 0
            ? priceWeightedGazoleSum / totalDurationGazoleMs
            : null,
      });

      totalPACAStations += 1;

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

  return {
    stations: stationContent,
    totalPACAStations,
    totalStationsWithoutE10,
    stationIdsWithoutE10,
    endOfYearPrices,
  };
}
