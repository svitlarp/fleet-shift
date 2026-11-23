import { describe, expect, it } from "vitest";
import type { SavingsMetrics } from "../scenarios/metrics.ts";
import { assumptionsFixture } from "../test-fixtures.ts";
import { buildPlan } from "./plan.ts";
import type { PlanCandidate } from "./plan.ts";

const savings = (
  medianEur: number,
  p10Eur = medianEur - 100,
): SavingsMetrics => ({
  medianEur,
  p10Eur,
  p90Eur: medianEur + 100,
  paybackShare: medianEur > 0 ? 0.9 : 0.1,
  cvar10Eur: p10Eur - 50,
});

const candidate = (
  vehicleId: string,
  overrides: Partial<PlanCandidate> = {},
): PlanCandidate => ({
  vehicleId,
  leaseEndDate: "2027-06-30",
  evId: "ev",
  budgetCostEur: 5000,
  savings: savings(1000),
  ...overrides,
});

const decisionOf = (plan: ReturnType<typeof buildPlan>, id: string) =>
  plan.entries.find((e) => e.vehicleId === id);

describe("buildPlan", () => {
  it("ranks by savings and never exceeds the budget", () => {
    const plan = buildPlan(
      [
        candidate("low", { savings: savings(500) }),
        candidate("high", { savings: savings(2000) }),
      ],
      assumptionsFixture({ budget2027Eur: 5000, budget2028Eur: 0 }),
    );
    expect(plan.years[0]?.vehicleIds).toEqual(["high"]);
    expect(plan.years[0]?.spentEur).toBeLessThanOrEqual(5000);
    expect(decisionOf(plan, "low")?.decision).toBe("over_budget");
  });

  it("returns an empty plan with zero budget", () => {
    const plan = buildPlan(
      [candidate("a")],
      assumptionsFixture({ budget2027Eur: 0, budget2028Eur: 0 }),
    );
    expect(plan.years.flatMap((y) => y.vehicleIds)).toEqual([]);
    expect(plan.totalMedianSavingsEur).toBe(0);
  });

  it("does not replace before the lease ends", () => {
    const plan = buildPlan(
      [candidate("late", { leaseEndDate: "2028-03-01" })],
      assumptionsFixture(),
    );
    expect(plan.years[0]?.vehicleIds).toEqual([]);
    expect(decisionOf(plan, "late")?.year).toBe(2028);
  });

  it("rolls an unfunded vehicle into the next year", () => {
    const plan = buildPlan(
      [candidate("a", { savings: savings(2000) }), candidate("b")],
      assumptionsFixture({ budget2027Eur: 5000, budget2028Eur: 5000 }),
    );
    expect(decisionOf(plan, "b")?.year).toBe(2028);
  });

  it("handles all leases ending in one year", () => {
    const plan = buildPlan(
      ["a", "b", "c"].map((id) => candidate(id)),
      assumptionsFixture({ budget2027Eur: 15_000, budget2028Eur: 0 }),
    );
    expect(plan.years[0]?.vehicleIds).toEqual(["a", "b", "c"]);
  });

  it("explains every non-replacement", () => {
    const plan = buildPlan(
      [
        candidate("none", { evId: null, savings: null }),
        candidate("later", { leaseEndDate: "2029-01-01" }),
        candidate("loss", { savings: savings(-100) }),
      ],
      assumptionsFixture(),
    );
    expect(plan.entries.map((e) => e.decision)).toEqual([
      "no_suitable_ev",
      "outside_horizon",
      "not_profitable",
    ]);
  });

  it("uses P10 in cautious mode", () => {
    const risky = candidate("risky", { savings: savings(1000, -50) });
    expect(
      decisionOf(
        buildPlan([risky], assumptionsFixture({ riskMode: "balanced" })),
        "risky",
      )?.decision,
    ).toBe("replace");
    expect(
      decisionOf(
        buildPlan([risky], assumptionsFixture({ riskMode: "cautious" })),
        "risky",
      )?.decision,
    ).toBe("not_profitable");
  });
});
