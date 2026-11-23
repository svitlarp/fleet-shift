import fs from "node:fs";
import { z } from "zod";
import {
  chargingStationSchema,
  evModelDetailsSchema,
  evModelSchema,
  fuelYearPriceSchema,
  iceReferenceEntrySchema,
} from "@fleetshift/core";
import type {
  ChargingStation,
  EvModel,
  EvModelDetails,
  FuelYearPrice,
  IceReferenceEntry,
} from "@fleetshift/core";
import { paths } from "./config/paths.ts";

const readJsonFile = (filePath: string): unknown =>
  JSON.parse(fs.readFileSync(filePath, "utf-8"));

const catalogFileSchema = z.object({
  source: z.object({
    name: z.string(),
    url: z.string(),
    sourceUpdatedAt: z.string(),
    hash: z.string(),
  }),
  vehicles: z.array(evModelSchema),
});

const stationsFileSchema = z.object({
  evStations: z.array(chargingStationSchema),
});

const fuelFileSchema = z.record(
  z.string(),
  z.object({ avgE10: z.number(), avgGazole: z.number() }),
);

export type EvCatalogFile = z.infer<typeof catalogFileSchema>;

export function getEvCatalog(): EvCatalogFile {
  return catalogFileSchema.parse(readJsonFile(paths.processed.evCatalog));
}

export function getIrveStations(): ChargingStation[] {
  return stationsFileSchema.parse(readJsonFile(paths.processed.irve))
    .evStations;
}

export function getFuelYearlyPrices(): FuelYearPrice[] {
  const file = fuelFileSchema.parse(readJsonFile(paths.processed.fuel));
  return Object.entries(file)
    .map(([year, price]) =>
      fuelYearPriceSchema.parse({
        year: Number(year),
        dieselEurPerLitre: price.avgGazole,
        petrolEurPerLitre: price.avgE10,
      }),
    )
    .sort((a, b) => a.year - b.year);
}

export function getIceReference(): IceReferenceEntry[] {
  return z
    .array(iceReferenceEntrySchema)
    .parse(readJsonFile(paths.processed.iceReference));
}

export function getEvModelDetails(): EvModelDetails {
  return evModelDetailsSchema.parse(readJsonFile(paths.catalog.evModelDetails));
}

export function getDemoFleetRows(): unknown[] {
  return z.array(z.unknown()).parse(readJsonFile(paths.demo.estateAgencyFleet));
}

export type { EvModel };
