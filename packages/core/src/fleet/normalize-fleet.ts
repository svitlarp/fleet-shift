import { z } from "zod";

const nestedVehicleSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  bodyType: z.string(),
  fuelType: z.string(),
  seats: z.number(),
  usage: z.object({ annualKm: z.number(), maxDailyKm: z.number() }),
  consumption: z.object({ litersPer100km: z.number() }),
  costs: z.object({
    purchasePrice: z.number(),
    maintenancePerYear: z.number(),
    insurancePerYear: z.number(),
    leaseMonthlyPayment: z.number(),
    leaseEndDate: z.string(),
  }),
  base: z.object({
    commune: z.string(),
    lat: z.number(),
    lon: z.number(),
    hasHomeCharging: z.boolean(),
  }),
});

/** Flattens the demo-fleet JSON shape; rows in the flat shape pass through unchanged. */
export function normalizeFleetRow(raw: unknown): unknown {
  const nested = nestedVehicleSchema.safeParse(raw);
  if (!nested.success) return raw;
  const v = nested.data;
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    bodyType: v.bodyType,
    fuelType: v.fuelType,
    seats: v.seats,
    annualKm: v.usage.annualKm,
    maxDailyKm: v.usage.maxDailyKm,
    litersPer100Km: v.consumption.litersPer100km,
    purchasePriceEur: v.costs.purchasePrice,
    leaseMonthlyEur: v.costs.leaseMonthlyPayment,
    maintenanceEurPerYear: v.costs.maintenancePerYear,
    insuranceEurPerYear: v.costs.insurancePerYear,
    leaseEndDate: v.costs.leaseEndDate,
    baseCommune: v.base.commune,
    baseLat: v.base.lat,
    baseLon: v.base.lon,
    hasDepotCharging: v.base.hasHomeCharging,
  };
}
