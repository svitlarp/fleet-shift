import { describe, expect, it } from "vitest";
import type { IceReferenceEntry } from "../domain/schemas.ts";
import { assumptionsFixture, vehicleFixture } from "../test-fixtures.ts";
import { resolveBaselinePrice } from "./baseline-price.ts";
import {
  evMonthlyLeaseEur,
  baselineMonthlyLeaseEur,
} from "./components/financing.ts";

const entry = (
  fuelType: IceReferenceEntry["fuelType"],
  medianPriceEur: number,
): IceReferenceEntry => ({
  makeKey: "SKODA",
  modelKey: "OCTAVIA",
  fuelType,
  medianPriceEur,
  rowCount: 3,
});
const octavia = vehicleFixture({
  make: "Škoda",
  model: "Octavia Combi 2.0 TDI",
  fuelType: "diesel",
  purchasePriceEur: 20_000,
});

describe("resolveBaselinePrice", () => {
  it("prefers the same model and fuel", () => {
    expect(
      resolveBaselinePrice(octavia, [
        entry("any", 31_000),
        entry("diesel", 35_000),
      ]),
    ).toEqual({ priceEur: 35_000, source: "open_data", tier: "exact" });
  });

  it("falls back to the same model with another fuel", () => {
    expect(
      resolveBaselinePrice(octavia, [
        entry("petrol", 30_000),
        entry("any", 31_000),
      ]),
    ).toEqual({ priceEur: 31_000, source: "open_data", tier: "other_fuel" });
  });

  it("falls back to the entered price when the model is unknown", () => {
    expect(
      resolveBaselinePrice(vehicleFixture(), [entry("diesel", 35_000)]),
    ).toEqual({
      priceEur: 25_000,
      source: "user",
      tier: "entered",
    });
  });
});

describe("baseline lease", () => {
  it("equals an EV lease at the same price and residual share", () => {
    const assumptions = assumptionsFixture({
      evResidualShare: 0.4,
      iceResidualShare: 0.4,
    });
    expect(
      baselineMonthlyLeaseEur({ assumptions, baselinePriceEur: 30_000 }),
    ).toBeCloseTo(evMonthlyLeaseEur(30_000, { assumptions }), 8);
  });
});
