import type { FleetAnalysis, PlanEntry } from "@fleetshift/core";
import { describe, expect, it } from "vitest";
import { buildActionSummary } from "./action-summary.ts";
import { DEFAULT_SORT, nextSort, sortDecisions } from "./sort-decisions.ts";
import type { DecisionRow } from "./sort-decisions.ts";

const row = (
  vehicleId: string,
  overrides: Partial<DecisionRow> = {},
): DecisionRow => ({
  vehicleId,
  vehicleName: vehicleId,
  make: "Renault",
  evId: "ev",
  evBrand: "PEUGEOT",
  evName: "e-208",
  decision: "not_profitable",
  year: null,
  medianEur: 0,
  p10Eur: 0,
  p90Eur: 0,
  paybackShare: 0,
  cvar10Eur: 0,
  ...overrides,
});

const ids = (rows: DecisionRow[]) => rows.map((r) => r.vehicleId);

describe("sortDecisions", () => {
  it("defaults to actionable decisions first, best savings within them", () => {
    const rows = [
      row("keep", { medianEur: 900 }),
      row("low", { decision: "replace", medianEur: 100 }),
      row("high", { decision: "replace", medianEur: 500 }),
    ];
    expect(ids(sortDecisions(rows, DEFAULT_SORT))).toEqual([
      "high",
      "low",
      "keep",
    ]);
  });

  it("sorts numbers in both directions", () => {
    const rows = [row("a", { medianEur: 1 }), row("b", { medianEur: 3 })];
    expect(
      ids(sortDecisions(rows, { key: "medianEur", direction: "desc" })),
    ).toEqual(["b", "a"]);
    expect(
      ids(sortDecisions(rows, { key: "medianEur", direction: "asc" })),
    ).toEqual(["a", "b"]);
  });

  it("keeps missing values last in both directions", () => {
    const rows = [
      row("none", { year: null }),
      row("y27", { year: 2027 }),
      row("y28", { year: 2028 }),
    ];
    expect(ids(sortDecisions(rows, { key: "year", direction: "asc" }))[2]).toBe(
      "none",
    );
    expect(
      ids(sortDecisions(rows, { key: "year", direction: "desc" }))[2],
    ).toBe("none");
  });

  it("toggles direction and picks a sensible first direction", () => {
    expect(nextSort(DEFAULT_SORT, "decision").direction).toBe("desc");
    expect(nextSort(DEFAULT_SORT, "medianEur").direction).toBe("desc");
    expect(nextSort(DEFAULT_SORT, "vehicleName").direction).toBe("asc");
  });
});

const entry = (
  vehicleId: string,
  decision: PlanEntry["decision"],
  savings = 0,
): PlanEntry => ({
  vehicleId,
  evId: decision === "replace" ? "ev" : null,
  decision,
  year: decision === "replace" ? 2028 : null,
  budgetCostEur: 5000,
  rankingSavingsEur: savings,
});

const analysis = (
  entries: PlanEntry[],
): Pick<FleetAnalysis, "plan" | "vehicles"> => {
  const replaced = entries.filter((e) => e.decision === "replace");
  return {
    plan: {
      entries,
      totalMedianSavingsEur: 0,
      years: [
        { year: 2027, budgetEur: 1, spentEur: 0, vehicleIds: [] },
        {
          year: 2028,
          budgetEur: 1,
          spentEur: replaced.length * 5000,
          vehicleIds: replaced.map((e) => e.vehicleId),
        },
      ],
    },
    vehicles: replaced.map((e) => ({
      vehicleId: e.vehicleId,
      candidates: [{ ev: { id: "ev", brand: "PEUGEOT", variant: "e-208" } }],
    })) as unknown as FleetAnalysis["vehicles"],
  };
};

describe("buildActionSummary", () => {
  it("states what to replace first and the follow-ups", () => {
    const text = buildActionSummary(
      analysis([
        entry("small", "replace", 100),
        entry("big", "replace", 900),
        entry("keep", "not_profitable"),
        entry("late", "outside_horizon"),
      ]),
      (id) => id.toUpperCase(),
    );
    expect(text).toContain("Replace 2 vehicles in 2028 for");
    expect(text).toContain("starting with BIG to PEUGEOT e-208");
    expect(text).toContain("keep 1 on combustion, review 1 after 2028");
  });

  it("is honest when nothing pays back", () => {
    const text = buildActionSummary(
      analysis([entry("a", "not_profitable")]),
      (id) => id,
    );
    expect(text).toContain("No replacement pays back");
    expect(text).toContain("keep 1 on combustion");
  });
});
