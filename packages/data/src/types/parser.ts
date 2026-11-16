// Interface with calculated Average Fuel Prices for every station
export interface StationAvgPrices {
  stationID: string;
  cp: string;
  priceE10Avg: number | null;
  priceGazoleAvg: number | null;
}

// Inetrface for every station
export interface StationFuelPrices {
  stationID: string;
  cp: string;
  priceE10: number | null;
  priceGazole: number | null;
  timestampE10: number | null;
  timestampGazole: number | null;
}

export interface CurrentStation {
  // Station ID from XML file
  stationID: string;
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

  // Sum of durations (ms) during which a price was known for E10 / Gazole
  totalDurationE10Ms: number;
  totalDurationGazoleMs: number;
}

export interface ParseResult {
  stations: StationAvgPrices[];
  totalPACAStations: number;
  totalStationsWithoutE10: number;
  stationIdsWithoutE10: Array<string>;
  endOfYearPrices: StationFuelPrices[];
}

// Types for Yearly Average Fuel Prices
export interface StationAvgPricesData {
  stations: StationAvgPrices[];
}

export interface YearlyAvgFuelPrices {
  sumE10: number;
  sumGazole: number;
  countE10: number;
  countGazole: number;
  avgE10: number | null;
  avgGazole: number | null;
}

export interface YearData {
  year: string;
  data: YearlyAvgFuelPrices;
}

export type YearlyFuelData = Record<string, YearlyAvgFuelPrices>;
