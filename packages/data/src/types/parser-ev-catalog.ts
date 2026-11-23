export interface CatalogVehicle {
  id: string;
  modelKey: string;
  brand: string;
  model: string;
  variant: string;
  bodyType: string;
  segment: string | null;
  priceEur: number;
  powerKw: number | null;
  kwhPer100Km: number;
  rangeKm: number;
  massKg: number | null;
  group: string | null;
  fiscalPower: number | null;
  emptyWeightKg: number | null;
  urbanRangeKm: number | null;
}

export interface EVCatalogSource {
  name: string;
  url: string;
  sourceUpdatedAt: string;
  hash: string;
}

export interface EVCatalog {
  source: EVCatalogSource;
  vehicles: CatalogVehicle[];
}

export interface ParseEVCatalogStats {
  electricRows: number;
  rejectedIncomplete: number;
  duplicatesRemoved: number;
}
