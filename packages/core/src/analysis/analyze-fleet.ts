import type { Assumptions } from "../config/assumptions.ts";
import type {
  ChargingStation,
  EvModel,
  FleetVehicle,
  FuelYearPrice,
} from "../domain/schemas.ts";
import { assessChargingAccess } from "../matching/charging-access.ts";
import type { ChargingAccess } from "../matching/charging-access.ts";
import { findRejection } from "../matching/hard-filters.ts";
import type { RejectionReason } from "../matching/hard-filters.ts";
import { buildPlan } from "../planner/plan.ts";
import type { ReplacementPlan } from "../planner/plan.ts";
import {
  fuelLogVolatility,
  generateScenarios,
  latestFuelPrice,
} from "../scenarios/generate.ts";
import { summarizeSavings } from "../scenarios/metrics.ts";
import type { SavingsMetrics } from "../scenarios/metrics.ts";
import { createRng, hashString } from "../scenarios/rng.ts";
import { evMonthlyLeaseEur } from "../tco/components/financing.ts";
import { computeTco } from "../tco/engine.ts";
import type { TcoContext, TcoResult } from "../tco/types.ts";

const TOP_CANDIDATES = 3;

export interface EvCandidateResult {
  ev: EvModel;
  tco: TcoResult;
  centralSavingsEur: number;
  savings: SavingsMetrics;
  budgetCostEur: number;
}

export interface VehicleAnalysis {
  vehicleId: string;
  baselineTco: TcoResult;
  charging: ChargingAccess;
  candidates: EvCandidateResult[];
  rejections: Partial<Record<RejectionReason, number>>;
}

export interface FleetAnalysis {
  vehicles: VehicleAnalysis[];
  plan: ReplacementPlan;
  fuelVolatility: { diesel: number; petrol: number };
  assumptions: Assumptions;
}

export interface AnalyzeFleetInput {
  vehicles: readonly FleetVehicle[];
  catalog: readonly EvModel[];
  stations: readonly ChargingStation[];
  fuelHistory: readonly FuelYearPrice[];
  assumptions: Assumptions;
}

function budgetCostEur(ev: EvModel, ctx: TcoContext): number {
  return ctx.assumptions.financingMode === "purchase"
    ? ev.priceEur
    : evMonthlyLeaseEur(ev.priceEur, ctx) * 12;
}

/** Keeps the cheapest variant of each model, so the top 3 are real alternatives. */
function topDistinctModels(
  ranked: readonly { ev: EvModel; tco: TcoResult }[],
): { ev: EvModel; tco: TcoResult }[] {
  const seen = new Set<string>();
  const top: { ev: EvModel; tco: TcoResult }[] = [];
  for (const item of ranked) {
    const key = `${item.ev.brand} ${item.ev.model}`;
    if (seen.has(key)) continue;
    seen.add(key);
    top.push(item);
    if (top.length === TOP_CANDIDATES) break;
  }
  return top;
}

function analyzeVehicle(
  vehicle: FleetVehicle,
  input: AnalyzeFleetInput,
  volatility: FleetAnalysis["fuelVolatility"],
): VehicleAnalysis {
  const { assumptions, catalog, stations, fuelHistory } = input;
  const fuelPriceEurPerLitre = latestFuelPrice(fuelHistory, vehicle.fuelType);
  if (fuelPriceEurPerLitre === null) {
    throw new RangeError("Fuel price history is empty");
  }
  const ctx: TcoContext = { vehicle, assumptions, fuelPriceEurPerLitre };
  const charging = assessChargingAccess(vehicle, stations, assumptions);
  const baselineTco = computeTco({ kind: "baseline" }, ctx);
  const rejections: VehicleAnalysis["rejections"] = {};
  const suitable: { ev: EvModel; tco: TcoResult }[] = [];

  for (const ev of catalog) {
    const reason = findRejection(vehicle, ev, charging, assumptions);
    if (reason !== null) {
      rejections[reason] = (rejections[reason] ?? 0) + 1;
      continue;
    }
    suitable.push({ ev, tco: computeTco({ kind: "ev", ev }, ctx) });
  }
  suitable.sort(
    (a, b) => a.tco.totalEur - b.tco.totalEur || a.ev.id.localeCompare(b.ev.id),
  );
  const top = topDistinctModels(suitable);

  // Every option is evaluated on the same draws, so differences reflect the option.
  const rng = createRng((assumptions.seed ^ hashString(vehicle.id)) >>> 0);
  const scenarios = generateScenarios(
    rng,
    volatility[vehicle.fuelType],
    assumptions,
  );
  const baselineTotals = scenarios.map(
    (s) => computeTco({ kind: "baseline" }, ctx, s).totalEur,
  );

  const candidates = top.map(({ ev, tco }) => {
    const savingsEur = scenarios.map(
      (s, i) =>
        (baselineTotals[i] ?? 0) -
        computeTco({ kind: "ev", ev }, ctx, s).totalEur,
    );
    return {
      ev,
      tco,
      centralSavingsEur: baselineTco.totalEur - tco.totalEur,
      savings: summarizeSavings(savingsEur),
      budgetCostEur: budgetCostEur(ev, ctx),
    };
  });

  return {
    vehicleId: vehicle.id,
    baselineTco,
    charging,
    candidates,
    rejections,
  };
}

/** Runs matching, TCO, scenarios and planning for a whole fleet. Deterministic for a seed. */
export function analyzeFleet(input: AnalyzeFleetInput): FleetAnalysis {
  const fuelVolatility = {
    diesel: fuelLogVolatility(input.fuelHistory, "diesel"),
    petrol: fuelLogVolatility(input.fuelHistory, "petrol"),
  };
  const vehicles = input.vehicles.map((v) =>
    analyzeVehicle(v, input, fuelVolatility),
  );
  const plan = buildPlan(
    vehicles.map((analysis, i) => {
      const best = analysis.candidates[0];
      return {
        vehicleId: analysis.vehicleId,
        leaseEndDate: input.vehicles[i]?.leaseEndDate ?? "",
        evId: best?.ev.id ?? null,
        budgetCostEur: best?.budgetCostEur ?? 0,
        savings: best?.savings ?? null,
      };
    }),
    input.assumptions,
  );
  return { vehicles, plan, fuelVolatility, assumptions: input.assumptions };
}
