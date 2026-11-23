import type { FleetAnalysis, PlanDecision } from "@fleetshift/core";
import { t } from "../i18n/en.ts";
import { formatEur } from "./format.ts";

export interface VehicleLabel {
  (vehicleId: string): string;
}

/** Builds the one or two sentence recommendation shown above the results. */
export function buildActionSummary(
  result: Pick<FleetAnalysis, "plan" | "vehicles">,
  vehicleLabel: VehicleLabel,
): string {
  const { entries, years } = result.plan;
  const count = (decision: PlanDecision) =>
    entries.filter((e) => e.decision === decision).length;
  const replaced = entries
    .filter((e) => e.decision === "replace")
    .sort((a, b) => (b.rankingSavingsEur ?? 0) - (a.rankingSavingsEur ?? 0));
  const followUps = [
    count("over_budget") > 0 ? t.summary.budget(count("over_budget")) : null,
    count("not_profitable") > 0
      ? t.summary.keep(count("not_profitable"))
      : null,
    count("outside_horizon") > 0
      ? t.summary.later(count("outside_horizon"))
      : null,
    count("no_suitable_ev") > 0
      ? t.summary.noEv(count("no_suitable_ev"))
      : null,
  ].filter((part): part is string => part !== null);
  const next = followUps.length > 0 ? t.summary.next(followUps.join(", ")) : "";

  const top = replaced[0];
  if (!top) {
    const fallback = followUps.length > 0 ? next : t.summary.improve;
    return `${t.summary.none} ${fallback}`;
  }

  const activeYears = years
    .filter((y) => y.vehicleIds.length > 0)
    .map((y) => `${String(y.year)} (${String(y.vehicleIds.length)})`)
    .join(" and ");
  const spentEur = years.reduce((sum, y) => sum + y.spentEur, 0);
  const best = result.vehicles
    .find((v) => v.vehicleId === top.vehicleId)
    ?.candidates.find((c) => c.ev.id === top.evId);
  const evName = best ? `${best.ev.brand} ${best.ev.variant}` : "the best EV";
  return `${t.summary.replace(
    replaced.length,
    activeYears,
    formatEur(spentEur),
    vehicleLabel(top.vehicleId),
    evName,
  )} ${next}`.trim();
}
