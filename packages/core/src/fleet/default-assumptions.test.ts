import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS } from "../config/assumptions.ts";
import { vehicleFixture } from "../test-fixtures.ts";
import {
  defaultAssumptionsForFleet,
  defaultBudgets,
  upgradeAssumptions,
} from "./default-assumptions.ts";

const fleet = [
  vehicleFixture({ leaseEndDate: "2026-06-30", leaseMonthlyEur: 300 }),
  vehicleFixture({ leaseEndDate: "2027-06-30", leaseMonthlyEur: 310 }),
  vehicleFixture({ leaseEndDate: "2028-06-30", leaseMonthlyEur: 400 }),
  vehicleFixture({ leaseEndDate: "2029-06-30", leaseMonthlyEur: 900 }),
];

describe("defaultBudgets", () => {
  it("uses a year of payments for leases ending in each plan year", () => {
    expect(defaultBudgets(fleet)).toEqual({
      budget2027Eur: 7400,
      budget2028Eur: 4800,
    });
  });

  it("uses a fifth of the price for owned cars", () => {
    expect(
      defaultBudgets([
        vehicleFixture({
          leaseEndDate: "2027-01-01",
          leaseMonthlyEur: 0,
          purchasePriceEur: 20_000,
        }),
      ]).budget2027Eur,
    ).toBe(4000);
  });
});

describe("upgradeAssumptions", () => {
  const version1 = {
    ...DEFAULT_ASSUMPTIONS,
    version: undefined,
    riskyMinPaybackShare: undefined,
    winterRangeFactor: 0.7,
    evResidualShare: 0.35,
    depotTariffEurPerKwh: 0.2,
    publicDcTariffEurPerKwh: 0.55,
    evMaintenanceFactor: 0.7,
    budget2027Eur: 60_000,
    budget2028Eur: 60_000,
  };

  it("moves untouched old defaults to the new ones", () => {
    expect(upgradeAssumptions(version1, fleet)).toEqual(
      defaultAssumptionsForFleet(fleet),
    );
  });

  it("keeps values someone edited", () => {
    const result = upgradeAssumptions(
      { ...version1, depotTariffEurPerKwh: 0.12, budget2027Eur: 9000 },
      fleet,
    );
    expect(result.depotTariffEurPerKwh).toBe(0.12);
    expect(result.budget2027Eur).toBe(9000);
    expect(result.winterRangeFactor).toBe(0.8);
  });

  it("does not change current values that match an old default", () => {
    const current = { ...DEFAULT_ASSUMPTIONS, depotTariffEurPerKwh: 0.2 };
    expect(upgradeAssumptions(current, fleet).depotTariffEurPerKwh).toBe(0.2);
  });

  it("falls back to fleet defaults when nothing is saved", () => {
    expect(upgradeAssumptions(undefined, fleet)).toEqual(
      defaultAssumptionsForFleet(fleet),
    );
  });
});
