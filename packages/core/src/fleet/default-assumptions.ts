import {
  ASSUMPTIONS_VERSION,
  assumptionsSchema,
  DEFAULT_ASSUMPTIONS,
  HORIZON_YEARS,
} from "../config/assumptions.ts";
import type { Assumptions } from "../config/assumptions.ts";
import type { FleetVehicle } from "../domain/schemas.ts";

type BudgetVehicle = Pick<
  FleetVehicle,
  "leaseEndDate" | "leaseMonthlyEur" | "purchasePriceEur"
>;

const BUDGET_ROUNDING_EUR = 100;

/** Defaults from before version 2; only values still equal to these are replaced. */
const VERSION_1_DEFAULTS = {
  winterRangeFactor: 0.7,
  evResidualShare: 0.35,
  depotTariffEurPerKwh: 0.2,
  publicDcTariffEurPerKwh: 0.55,
  evMaintenanceFactor: 0.7,
  budget2027Eur: 60_000,
  budget2028Eur: 60_000,
} as const;

/** Owned cars have no lease, so a fifth of their price stands in for a year's cost. */
const yearlyCostEur = (v: BudgetVehicle): number =>
  v.leaseMonthlyEur > 0
    ? v.leaseMonthlyEur * 12
    : v.purchasePriceEur / HORIZON_YEARS;

/** One year of current payments for the cars whose lease ends by 2027, and in 2028. */
export function defaultBudgets(
  vehicles: readonly BudgetVehicle[],
): Pick<Assumptions, "budget2027Eur" | "budget2028Eur"> {
  let budget2027Eur = 0;
  let budget2028Eur = 0;
  for (const vehicle of vehicles) {
    const year = Number(vehicle.leaseEndDate.slice(0, 4));
    if (year <= 2027) budget2027Eur += yearlyCostEur(vehicle);
    else if (year === 2028) budget2028Eur += yearlyCostEur(vehicle);
  }
  const roundUp = (value: number) =>
    Math.ceil(value / BUDGET_ROUNDING_EUR) * BUDGET_ROUNDING_EUR;
  return {
    budget2027Eur: roundUp(budget2027Eur),
    budget2028Eur: roundUp(budget2028Eur),
  };
}

export function defaultAssumptionsForFleet(
  vehicles: readonly BudgetVehicle[],
): Assumptions {
  return { ...DEFAULT_ASSUMPTIONS, ...defaultBudgets(vehicles) };
}

/** Moves saved version 1 values to current defaults and keeps anything edited. */
export function upgradeAssumptions(
  saved: unknown,
  vehicles: readonly BudgetVehicle[],
): Assumptions {
  const defaults = defaultAssumptionsForFleet(vehicles);
  if (typeof saved !== "object" || saved === null) return defaults;
  const values = saved as Record<string, unknown>;
  if (values.version === ASSUMPTIONS_VERSION) {
    return assumptionsSchema.parse(values);
  }
  const upgraded: Record<string, unknown> = {
    ...values,
    version: ASSUMPTIONS_VERSION,
  };
  for (const [key, oldDefault] of Object.entries(VERSION_1_DEFAULTS)) {
    if (values[key] === oldDefault) {
      upgraded[key] = defaults[key as keyof typeof VERSION_1_DEFAULTS];
    }
  }
  return assumptionsSchema.parse(upgraded);
}
