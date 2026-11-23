import { describe, expect, it } from "vitest";
import { assumptionsFixture, fuelHistoryFixture } from "../test-fixtures.ts";
import {
  fuelLogVolatility,
  generateScenarios,
  latestFuelPrice,
} from "./generate.ts";
import { quantile, summarizeSavings } from "./metrics.ts";
import { createRng, hashString, standardNormal } from "./rng.ts";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("produces roughly standard normal samples", () => {
    const rng = createRng(7);
    const xs = Array.from({ length: 20_000 }, () => standardNormal(rng));
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length;
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(Math.abs(variance - 1)).toBeLessThan(0.05);
  });

  it("hashes strings stably", () => {
    expect(hashString("veh-001")).toBe(hashString("veh-001"));
    expect(hashString("veh-001")).not.toBe(hashString("veh-002"));
  });
});

describe("fuel history", () => {
  it("uses the latest year's price", () => {
    expect(latestFuelPrice(fuelHistoryFixture, "diesel")).toBe(1.6);
    expect(latestFuelPrice([], "petrol")).toBeNull();
  });

  it("has zero volatility for constant prices or too little data", () => {
    const flat = [2020, 2021, 2022].map((year) => ({
      year,
      dieselEurPerLitre: 1.5,
      petrolEurPerLitre: 1.5,
    }));
    expect(fuelLogVolatility(flat, "diesel")).toBe(0);
    expect(fuelLogVolatility(flat.slice(0, 2), "diesel")).toBe(0);
  });
});

describe("generateScenarios", () => {
  const a = assumptionsFixture({ scenarioCount: 50 });

  it("reproduces the same scenarios for the same seed", () => {
    expect(generateScenarios(createRng(1), 0.1, a)).toEqual(
      generateScenarios(createRng(1), 0.1, a),
    );
  });

  it("collapses to central values at zero volatility", () => {
    const [s] = generateScenarios(createRng(1), 0, {
      scenarioCount: 1,
      electricityVolatility: 0,
      mileageVolatility: 0,
      residualVolatility: 0,
    });
    expect(s?.fuelPriceFactors).toEqual([1, 1, 1, 1, 1]);
    expect(s?.mileageFactor).toBe(1);
  });
});

describe("summarizeSavings", () => {
  it("computes metrics on a known distribution", () => {
    const values = Array.from({ length: 101 }, (_, i) => i - 50);
    const m = summarizeSavings(values);
    expect(m.medianEur).toBe(0);
    expect(m.p10Eur).toBe(-40);
    expect(m.p90Eur).toBe(40);
    expect(m.paybackShare).toBeCloseTo(50 / 101, 6);
    expect(m.cvar10Eur).toBe(-45);
    expect(m.p10Eur).toBeLessThanOrEqual(m.medianEur);
    expect(m.medianEur).toBeLessThanOrEqual(m.p90Eur);
  });

  it("handles empty input", () => {
    expect(summarizeSavings([]).medianEur).toBe(0);
    expect(quantile([], 0.5)).toBe(0);
  });
});
