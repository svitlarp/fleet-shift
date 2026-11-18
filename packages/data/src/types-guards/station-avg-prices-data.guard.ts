import type {
  StationAvgPrices,
  StationAvgPricesData,
} from "../types/parser.ts";

function isStationAvgPrices(data: unknown): data is StationAvgPrices {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  if (
    !("stationID" in data) ||
    !("cp" in data) ||
    !("priceE10Avg" in data) ||
    !("priceGazoleAvg" in data)
  ) {
    return false;
  }

  return (
    typeof data.stationID === "string" &&
    typeof data.cp === "string" &&
    (typeof data.priceE10Avg === "number" || data.priceE10Avg === null) &&
    (typeof data.priceGazoleAvg === "number" || data.priceGazoleAvg === null)
  );
}

export function isStationAvgPricesData(
  data: unknown,
): data is StationAvgPricesData {
  if (typeof data !== "object" || data === null || !("stations" in data)) {
    return false;
  }
  return (
    Array.isArray(data.stations) && data.stations.every(isStationAvgPrices)
  );
}
