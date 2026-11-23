import { PLAN_YEARS } from "../config/assumptions.ts";
import type { Assumptions } from "../config/assumptions.ts";
import type { SavingsMetrics } from "../scenarios/metrics.ts";

export type PlanDecision =
  | "replace"
  | "over_budget"
  | "not_profitable"
  | "no_suitable_ev"
  | "outside_horizon";

export interface PlanCandidate {
  vehicleId: string;
  leaseEndDate: string;
  evId: string | null;
  /** Amount charged to the replacement year's budget, EUR. */
  budgetCostEur: number;
  savings: SavingsMetrics | null;
}

export interface PlanEntry {
  vehicleId: string;
  evId: string | null;
  decision: PlanDecision;
  year: number | null;
  budgetCostEur: number;
  rankingSavingsEur: number | null;
}

export interface YearPlan {
  year: number;
  budgetEur: number;
  spentEur: number;
  vehicleIds: string[];
}

export interface ReplacementPlan {
  entries: PlanEntry[];
  years: YearPlan[];
  totalMedianSavingsEur: number;
}

type PlanAssumptions = Pick<
  Assumptions,
  | "riskMode"
  | "budget2027Eur"
  | "budget2028Eur"
  | "minPaybackShare"
  | "riskyMinPaybackShare"
>;

const RANKING_METRIC = {
  cautious: "p10Eur",
  balanced: "medianEur",
  risky: "p90Eur",
} as const;

const rankingValue = (s: SavingsMetrics, mode: Assumptions["riskMode"]) =>
  s[RANKING_METRIC[mode]];

const leaseEndYear = (date: string): number => Number(date.slice(0, 4));
const LAST_PLAN_YEAR = Math.max(...PLAN_YEARS);

interface EligibleCandidate extends PlanCandidate {
  savings: SavingsMetrics;
}

function ineligibleDecision(
  c: PlanCandidate,
  a: PlanAssumptions,
): PlanDecision | null {
  if (c.evId === null || c.savings === null) return "no_suitable_ev";
  if (leaseEndYear(c.leaseEndDate) > LAST_PLAN_YEAR) {
    return "outside_horizon";
  }
  const profitable =
    rankingValue(c.savings, a.riskMode) > 0 &&
    c.savings.paybackShare >=
      (a.riskMode === "risky" ? a.riskyMinPaybackShare : a.minPaybackShare);
  return profitable ? null : "not_profitable";
}

/**
 * Greedy yearly selection: a vehicle becomes eligible in its lease-end year,
 * eligible vehicles are ranked by savings (P10 if cautious, median if balanced, P90 if risky)
 * and chosen while the budget allows. Unfunded vehicles roll to the next year.
 */
export function buildPlan(
  candidates: readonly PlanCandidate[],
  assumptions: PlanAssumptions,
): ReplacementPlan {
  const decisions = new Map<string, PlanEntry>();
  const pending: EligibleCandidate[] = [];

  for (const c of candidates) {
    const decision = ineligibleDecision(c, assumptions);
    if (decision === null && c.savings !== null) {
      pending.push({ ...c, savings: c.savings });
      continue;
    }
    decisions.set(c.vehicleId, {
      vehicleId: c.vehicleId,
      evId: c.evId,
      decision: decision ?? "no_suitable_ev",
      year: null,
      budgetCostEur: c.budgetCostEur,
      rankingSavingsEur: c.savings
        ? rankingValue(c.savings, assumptions.riskMode)
        : null,
    });
  }

  const budgets: Record<number, number> = {
    2027: assumptions.budget2027Eur,
    2028: assumptions.budget2028Eur,
  };
  const years: YearPlan[] = [];
  const selected = new Set<string>();

  for (const year of PLAN_YEARS) {
    const budgetEur = budgets[year] ?? 0;
    let spentEur = 0;
    const vehicleIds: string[] = [];
    const eligible = pending
      .filter(
        (c) =>
          !selected.has(c.vehicleId) && leaseEndYear(c.leaseEndDate) <= year,
      )
      .sort((a, b) => {
        const diff =
          rankingValue(b.savings, assumptions.riskMode) -
          rankingValue(a.savings, assumptions.riskMode);
        return diff !== 0 ? diff : a.vehicleId.localeCompare(b.vehicleId);
      });

    for (const c of eligible) {
      if (spentEur + c.budgetCostEur > budgetEur) continue;
      spentEur += c.budgetCostEur;
      selected.add(c.vehicleId);
      vehicleIds.push(c.vehicleId);
      decisions.set(c.vehicleId, {
        vehicleId: c.vehicleId,
        evId: c.evId,
        decision: "replace",
        year,
        budgetCostEur: c.budgetCostEur,
        rankingSavingsEur: rankingValue(c.savings, assumptions.riskMode),
      });
    }
    years.push({ year, budgetEur, spentEur, vehicleIds });
  }

  for (const c of pending) {
    if (selected.has(c.vehicleId)) continue;
    decisions.set(c.vehicleId, {
      vehicleId: c.vehicleId,
      evId: c.evId,
      decision: "over_budget",
      year: null,
      budgetCostEur: c.budgetCostEur,
      rankingSavingsEur: rankingValue(c.savings, assumptions.riskMode),
    });
  }

  const totalMedianSavingsEur = pending
    .filter((c) => selected.has(c.vehicleId))
    .reduce((sum, c) => sum + c.savings.medianEur, 0);

  return {
    entries: candidates.flatMap((c) => decisions.get(c.vehicleId) ?? []),
    years,
    totalMedianSavingsEur,
  };
}
