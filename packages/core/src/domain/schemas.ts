import { z } from "zod";

export const fuelTypeSchema = z.enum(["diesel", "petrol"]);
export const bodyTypeSchema = z.enum([
  "hatchback",
  "sedan",
  "estate",
  "suv",
  "mpv",
  "van",
]);

const isoDate = z.iso.date();

export const fleetVehicleSchema = z
  .object({
    id: z.string().trim().min(1),
    make: z.string().trim().min(1),
    model: z.string().trim().min(1),
    year: z.number().int().min(1990).max(2030),
    bodyType: bodyTypeSchema,
    fuelType: fuelTypeSchema,
    seats: z.number().int().min(1).max(9),
    annualKm: z.number().min(0).max(200_000),
    maxDailyKm: z.number().positive().max(1500),
    litersPer100Km: z.number().positive().max(40),
    purchasePriceEur: z.number().positive(),
    leaseMonthlyEur: z.number().min(0),
    maintenanceEurPerYear: z.number().min(0),
    insuranceEurPerYear: z.number().min(0),
    leaseEndDate: isoDate,
    baseCommune: z.string().trim().min(1),
    baseLat: z.number().min(-90).max(90),
    baseLon: z.number().min(-180).max(180),
    hasDepotCharging: z.boolean(),
    cargoVolumeM3: z.number().positive().nullable().default(null),
    payloadKg: z.number().positive().nullable().default(null),
  })
  .strict();

export const evModelSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().min(1),
  bodyType: z.string().min(1),
  segment: z.string().nullable(),
  priceEur: z.number().positive(),
  powerKw: z.number().nullable(),
  kwhPer100Km: z.number().positive(),
  rangeKm: z.number().positive(),
  massKg: z.number().nullable(),
});

export const chargingStationSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  chargingPoints: z.number().int().min(0),
  maxPowerKw: z.number().nullable(),
});

export const fuelYearPriceSchema = z.object({
  year: z.number().int(),
  dieselEurPerLitre: z.number().positive(),
  petrolEurPerLitre: z.number().positive(),
});

export const iceReferenceEntrySchema = z.object({
  makeKey: z.string().min(1),
  modelKey: z.string().min(1),
  fuelType: z.enum(["diesel", "petrol", "any"]),
  medianPriceEur: z.number().positive(),
  rowCount: z.number().int().positive(),
});

export type IceReferenceEntry = z.infer<typeof iceReferenceEntrySchema>;
export type FuelType = z.infer<typeof fuelTypeSchema>;
export type BodyType = z.infer<typeof bodyTypeSchema>;
export type FleetVehicle = z.infer<typeof fleetVehicleSchema>;
export type FleetVehicleInput = z.input<typeof fleetVehicleSchema>;
export type EvModel = z.infer<typeof evModelSchema>;
export type ChargingStation = z.infer<typeof chargingStationSchema>;
export type FuelYearPrice = z.infer<typeof fuelYearPriceSchema>;
