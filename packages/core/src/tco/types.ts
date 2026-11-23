import type { Assumptions } from "../config/assumptions.ts";
import type { ValueSource } from "../domain/provenance.ts";
import type { EvModel, FleetVehicle } from "../domain/schemas.ts";

export type TcoOption = { kind: "baseline" } | { kind: "ev"; ev: EvModel };

export type CostComponentId =
  "financing" | "energy" | "maintenance" | "insurance" | "residual";

export interface TcoContext {
  vehicle: FleetVehicle;
  assumptions: Assumptions;
  /** Base fuel price for this vehicle's fuel, EUR/L. */
  fuelPriceEurPerLitre: number;
  /** New equivalent combustion car price, EUR. */
  baselinePriceEur: number;
}

/** Multipliers on central values; index 0 is operating year 1. */
export interface Scenario {
  fuelPriceFactors: readonly number[];
  electricityPriceFactors: readonly number[];
  mileageFactor: number;
  residualFactor: number;
}

/** Costs are positive and revenues negative; index 0 is t = 0 (replacement). */
export type YearlyCashflow = readonly number[];

export interface TcoComponent {
  id: CostComponentId;
  source: ValueSource;
  appliesTo(option: TcoOption, ctx: TcoContext): boolean;
  cashflows(
    option: TcoOption,
    ctx: TcoContext,
    scenario: Scenario,
  ): YearlyCashflow;
}

export interface TcoResult {
  totalEur: number;
  perKmEur: number;
  breakdown: Partial<Record<CostComponentId, number>>;
  cashflowEur: number[];
  provenance: Partial<Record<CostComponentId, ValueSource>>;
}
