import { describe, expect, it } from "vitest";
import {
  assumptionsFixture,
  evFixture,
  fuelHistoryFixture,
  stationFixture,
  vehicleFixture,
} from "../test-fixtures.ts";
import { computeTco } from "../tco/engine.ts";
import { analyzeFleet } from "./analyze-fleet.ts";
import type { AnalyzeFleetInput } from "./analyze-fleet.ts";

const input = (
  overrides: Partial<AnalyzeFleetInput> = {},
): AnalyzeFleetInput => ({
  vehicles: [vehicleFixture()],
  catalog: [
    evFixture(),
    evFixture({
      id: "ev2",
      model: "MEGANE",
      brand: "RENAULT",
      priceEur: 35_000,
    }),
    evFixture({ id: "ev3", model: "C4", brand: "CITROEN", priceEur: 40_000 }),
    evFixture({ id: "ev4", model: "ID3", brand: "VW", priceEur: 45_000 }),
    evFixture({ id: "same", priceEur: 31_000 }),
  ],
  stations: [stationFixture()],
  fuelHistory: fuelHistoryFixture,
  iceReference: [],
  assumptions: assumptionsFixture({ scenarioCount: 100 }),
  ...overrides,
});

describe("analyzeFleet", () => {
  it("returns the top 3 distinct models ordered by TCO", () => {
    const [v] = analyzeFleet(input()).vehicles;
    expect(v?.candidates.map((c) => c.ev.id)).toEqual(["ev1", "ev2", "ev3"]);
  });

  it("is deterministic for a seed", () => {
    expect(analyzeFleet(input())).toEqual(analyzeFleet(input()));
  });

  it("keeps P10 <= median <= P90", () => {
    for (const c of analyzeFleet(input()).vehicles[0]?.candidates ?? []) {
      expect(c.savings.p10Eur).toBeLessThanOrEqual(c.savings.medianEur);
      expect(c.savings.medianEur).toBeLessThanOrEqual(c.savings.p90Eur);
    }
  });

  it("matches the deterministic TCO when all volatility is zero", () => {
    const flat = fuelHistoryFixture.map((p) => ({
      ...p,
      dieselEurPerLitre: 1.6,
      petrolEurPerLitre: 1.7,
    }));
    const assumptions = assumptionsFixture({
      scenarioCount: 10,
      electricityVolatility: 0,
      mileageVolatility: 0,
      residualVolatility: 0,
    });
    const [v] = analyzeFleet(
      input({ fuelHistory: flat, assumptions }),
    ).vehicles;
    const c = v?.candidates[0];
    expect(c?.savings.medianEur).toBeCloseTo(c?.centralSavingsEur ?? NaN, 6);
  });

  it("explains when no EV is suitable", () => {
    const result = analyzeFleet(
      input({ vehicles: [vehicleFixture({ maxDailyKm: 900 })] }),
    );
    expect(result.vehicles[0]?.candidates).toEqual([]);
    expect(result.vehicles[0]?.rejections.winter_range).toBe(5);
    expect(result.plan.entries[0]?.decision).toBe("no_suitable_ev");
  });

  it("charges the purchase price to the budget when buying", () => {
    const result = analyzeFleet(
      input({
        assumptions: assumptionsFixture({
          scenarioCount: 10,
          financingMode: "purchase",
        }),
      }),
    );
    expect(result.vehicles[0]?.candidates[0]?.budgetCostEur).toBe(30_000);
  });

  it("fails clearly on empty fuel history", () => {
    expect(() => analyzeFleet(input({ fuelHistory: [] }))).toThrow(RangeError);
  });

  it("reports the same central TCO as the engine", () => {
    const vehicle = vehicleFixture();
    const assumptions = assumptionsFixture({ scenarioCount: 10 });
    const result = analyzeFleet(input({ vehicles: [vehicle], assumptions }));
    const direct = computeTco(
      { kind: "baseline" },
      {
        vehicle,
        assumptions,
        fuelPriceEurPerLitre: 1.6,
        baselinePriceEur: vehicle.purchasePriceEur,
      },
    );
    expect(result.vehicles[0]?.baselineTco.totalEur).toBe(direct.totalEur);
  });
});
