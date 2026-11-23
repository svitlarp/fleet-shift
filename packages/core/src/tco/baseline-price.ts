import type { ValueSource } from "../domain/provenance.ts";
import type { FleetVehicle, IceReferenceEntry } from "../domain/schemas.ts";

export type BaselinePriceTier = "exact" | "other_fuel" | "entered";

export interface BaselinePrice {
  priceEur: number;
  source: ValueSource;
  tier: BaselinePriceTier;
}

/** Uppercase ASCII key, so "Škoda" and "SKODA" compare equal. */
export function referenceKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * New-car price for the combustion alternative: ADEME median for the same model
 * and fuel, then the same model with any fuel, then the price entered for the car.
 */
export function resolveBaselinePrice(
  vehicle: Pick<
    FleetVehicle,
    "make" | "model" | "fuelType" | "purchasePriceEur"
  >,
  reference: readonly IceReferenceEntry[],
): BaselinePrice {
  const makeKey = referenceKey(vehicle.make);
  const modelKey = referenceKey(vehicle.model.trim().split(/\s+/)[0] ?? "");
  const sameModel = reference.filter(
    (e) => e.makeKey === makeKey && e.modelKey === modelKey,
  );
  const exact = sameModel.find((e) => e.fuelType === vehicle.fuelType);
  if (exact) {
    return {
      priceEur: exact.medianPriceEur,
      source: "open_data",
      tier: "exact",
    };
  }
  const anyFuel = sameModel.find((e) => e.fuelType === "any");
  if (anyFuel) {
    return {
      priceEur: anyFuel.medianPriceEur,
      source: "open_data",
      tier: "other_fuel",
    };
  }
  return {
    priceEur: vehicle.purchasePriceEur,
    source: "user",
    tier: "entered",
  };
}
