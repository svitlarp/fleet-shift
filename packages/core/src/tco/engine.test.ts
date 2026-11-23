import { describe, expect, it } from "vitest";
import {
  assumptionsFixture,
  evFixture,
  vehicleFixture,
} from "../test-fixtures.ts";
import { blendedElectricityEurPerKwh } from "./components/energy.ts";
import { monthlyLeaseEur } from "./components/financing.ts";
import { CENTRAL_SCENARIO, computeTco } from "./engine.ts";
import { DEFAULT_TCO_COMPONENTS } from "./registry.ts";
import type { TcoComponent, TcoContext } from "./types.ts";

const ctx = (
  vehicle = vehicleFixture(),
  assumptions = assumptionsFixture(),
): TcoContext => ({ vehicle, assumptions, fuelPriceEurPerLitre: 1.6 });

describe("computeTco golden cases", () => {
  it("matches the hand calculation for an ICE baseline lease", () => {
    const tco = computeTco({ kind: "baseline" }, ctx());
    expect(Math.abs(tco.totalEur - 31162.756317)).toBeLessThan(1);
  });

  it("matches the hand calculation for a leased EV on public charging", () => {
    const tco = computeTco({ kind: "ev", ev: evFixture() }, ctx());
    expect(Math.abs(tco.totalEur - 35508.263222)).toBeLessThan(1);
  });

  it("matches the hand calculation for a purchased EV with depot charging", () => {
    const tco = computeTco(
      { kind: "ev", ev: evFixture() },
      ctx(
        vehicleFixture({ hasDepotCharging: true }),
        assumptionsFixture({ financingMode: "purchase" }),
      ),
    );
    expect(Math.abs(tco.totalEur - 31871.83685)).toBeLessThan(1);
  });
});

describe("computeTco invariants", () => {
  it("has zero energy at zero mileage and no per-km cost", () => {
    const tco = computeTco(
      { kind: "baseline" },
      ctx(vehicleFixture({ annualKm: 0 })),
    );
    expect(tco.breakdown.energy).toBe(0);
    expect(tco.perKmEur).toBe(0);
  });

  it("sums undiscounted cash flows to the total when r = 0", () => {
    const tco = computeTco(
      { kind: "ev", ev: evFixture() },
      ctx(vehicleFixture(), assumptionsFixture({ discountRate: 0 })),
    );
    const sum = tco.cashflowEur.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(tco.totalEur, 6);
  });

  it("excludes resale revenue under a lease", () => {
    const tco = computeTco({ kind: "ev", ev: evFixture() }, ctx());
    expect(tco.breakdown.residual).toBeUndefined();
  });

  it("accepts a new cost component without engine changes", () => {
    const extra: TcoComponent = {
      id: "insurance",
      source: "assumption",
      appliesTo: () => true,
      cashflows: () => [100, 0, 0, 0, 0, 0],
    };
    const base = computeTco({ kind: "baseline" }, ctx());
    const extended = computeTco({ kind: "baseline" }, ctx(), CENTRAL_SCENARIO, [
      ...DEFAULT_TCO_COMPONENTS.filter((c) => c.id !== "insurance"),
      extra,
    ]);
    expect(extended.breakdown.insurance).toBe(100);
    expect(extended.totalEur).toBeLessThan(base.totalEur);
  });
});

describe("financing and energy helpers", () => {
  it("handles a zero lease rate", () => {
    expect(monthlyLeaseEur(30_000, 6000, 0, 60)).toBe(400);
  });

  it("uses only public tariffs without depot charging", () => {
    expect(
      blendedElectricityEurPerKwh(false, assumptionsFixture()),
    ).toBeCloseTo(0.445, 6);
    expect(blendedElectricityEurPerKwh(true, assumptionsFixture())).toBeCloseTo(
      0.249,
      6,
    );
  });
});
