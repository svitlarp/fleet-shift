import type {
  ChargingStation,
  EvModel,
  EvModelDetails,
  FuelYearPrice,
  IceReferenceEntry,
} from "@fleetshift/core";
import {
  getDemoFleetRows,
  getEvCatalog,
  getEvModelDetails,
  getFuelYearlyPrices,
  getIceReference,
  getIrveStations,
} from "@fleetshift/data";

export interface ReferenceData {
  catalog: EvModel[];
  modelDetails: EvModelDetails;
  catalogSource: { name: string; url: string; sourceUpdatedAt: string };
  stations: ChargingStation[];
  fuelHistory: FuelYearPrice[];
  iceReference: IceReferenceEntry[];
  demoFleetRows: unknown[];
}

export function loadReferenceData(): ReferenceData {
  const { vehicles, source } = getEvCatalog();
  return {
    catalog: vehicles,
    modelDetails: getEvModelDetails(),
    catalogSource: {
      name: source.name,
      url: source.url,
      sourceUpdatedAt: source.sourceUpdatedAt,
    },
    stations: getIrveStations(),
    fuelHistory: getFuelYearlyPrices(),
    iceReference: getIceReference(),
    demoFleetRows: getDemoFleetRows(),
  };
}
