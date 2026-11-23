import type { PlanDecision } from "@fleetshift/core";

export interface DecisionRow {
  vehicleId: string;
  vehicleName: string;
  make: string;
  evId: string | null;
  evBrand: string | null;
  evName: string | null;
  decision: PlanDecision;
  year: number | null;
  medianEur: number | null;
  p10Eur: number | null;
  p90Eur: number | null;
  paybackShare: number | null;
  cvar10Eur: number | null;
}

export type SortKey =
  | "vehicleName"
  | "evName"
  | "decision"
  | "year"
  | "medianEur"
  | "p10Eur"
  | "paybackShare"
  | "cvar10Eur";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

const DECISION_ORDER: Readonly<Record<PlanDecision, number>> = {
  replace: 0,
  over_budget: 1,
  not_profitable: 2,
  outside_horizon: 3,
  no_suitable_ev: 4,
};

export const DEFAULT_SORT: SortState = { key: "decision", direction: "asc" };

const TEXT_OR_RANK_KEYS: readonly SortKey[] = [
  "vehicleName",
  "evName",
  "decision",
  "year",
];

/** Text-like columns start ascending; money columns start with the largest value. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: TEXT_OR_RANK_KEYS.includes(key) ? "asc" : "desc" };
}

function sortValue(row: DecisionRow, key: SortKey): string | number | null {
  return key === "decision" ? DECISION_ORDER[row.decision] : row[key];
}

/** Missing values stay last in both directions; ties go to higher median, then id. */
export function sortDecisions(
  rows: readonly DecisionRow[],
  { key, direction }: SortState,
): DecisionRow[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = sortValue(a, key);
    const right = sortValue(b, key);
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    if (left !== null && right !== null && left !== right) {
      const order =
        typeof left === "string" && typeof right === "string"
          ? left.localeCompare(right)
          : Number(left) - Number(right);
      return order * sign;
    }
    const medianOrder = (b.medianEur ?? -Infinity) - (a.medianEur ?? -Infinity);
    return medianOrder !== 0
      ? medianOrder
      : a.vehicleId.localeCompare(b.vehicleId);
  });
}
