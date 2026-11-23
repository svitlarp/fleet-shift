import type { ChargingStation, EvModel, FuelYearPrice } from "@fleetshift/core";
import {
  getDemoFleetRows,
  getEvCatalog,
  getFuelYearlyPrices,
  getIrveStations,
} from "@fleetshift/data";

export interface ReferenceData {
  catalog: EvModel[];
  catalogSource: { name: string; url: string; sourceUpdatedAt: string };
  stations: ChargingStation[];
  fuelHistory: FuelYearPrice[];
  demoFleetRows: unknown[];
}

export function loadReferenceData(): ReferenceData {
  const { vehicles, source } = getEvCatalog();
  return {
    catalog: vehicles,
    catalogSource: {
      name: source.name,
      url: source.url,
      sourceUpdatedAt: source.sourceUpdatedAt,
    },
    stations: getIrveStations(),
    fuelHistory: getFuelYearlyPrices(),
    demoFleetRows: getDemoFleetRows(),
  };
}
