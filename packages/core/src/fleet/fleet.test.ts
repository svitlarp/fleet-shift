import { describe, expect, it } from "vitest";
import { vehicleFixture } from "../test-fixtures.ts";
import { normalizeFleetRow } from "./normalize-fleet.ts";
import { validateFleet } from "./validate-fleet.ts";

const fleet = (n: number) =>
  Array.from({ length: n }, (_, i) => vehicleFixture({ id: `v${String(i)}` }));

describe("validateFleet", () => {
  it("accepts a valid fleet", () => {
    const result = validateFleet(fleet(5));
    expect(result.vehicles).toHaveLength(5);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports the row and field of each error", () => {
    const rows = fleet(5);
    const result = validateFleet([
      ...rows.slice(0, 2),
      { ...rows[2], annualKm: -1 },
      ...rows.slice(3),
    ]);
    expect(result.errors).toEqual([
      expect.objectContaining({ row: 3, field: "annualKm" }),
    ]);
  });

  it("rejects duplicate ids and warns on fleet size", () => {
    const v = vehicleFixture();
    const result = validateFleet([v, v]);
    expect(result.errors[0]).toMatchObject({ row: 2, field: "id" });
    expect(result.warnings[0]?.field).toBe("fleet");
  });
});

describe("normalizeFleetRow", () => {
  it("flattens the nested demo shape", () => {
    const row = normalizeFleetRow({
      id: "veh-001",
      make: "Peugeot",
      model: "208",
      year: 2020,
      bodyType: "hatchback",
      fuelType: "diesel",
      seats: 5,
      usage: { annualKm: 24_400, typicalDailyKm: 84, maxDailyKm: 160 },
      consumption: { litersPer100km: 4.9 },
      costs: {
        purchasePrice: 21_500,
        maintenancePerYear: 1010,
        insurancePerYear: 800,
        leaseMonthlyPayment: 335,
        leaseEndDate: "2028-12-31",
      },
      base: { commune: "Nice", lat: 43.71, lon: 7.26, hasHomeCharging: false },
    });
    const result = validateFleet([row]);
    expect(result.errors).toEqual([]);
    expect(result.vehicles[0]?.leaseMonthlyEur).toBe(335);
  });

  it("passes flat rows through unchanged", () => {
    const flat = vehicleFixture();
    expect(normalizeFleetRow(flat)).toBe(flat);
  });
});
