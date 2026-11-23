import { HORIZON_YEARS } from "../config/assumptions.ts";
import type { Assumptions } from "../config/assumptions.ts";
import type { FuelType, FuelYearPrice } from "../domain/schemas.ts";
import type { Scenario } from "../tco/types.ts";
import { standardNormal } from "./rng.ts";
import type { Rng } from "./rng.ts";

const priceOf = (p: FuelYearPrice, fuel: FuelType): number =>
  fuel === "diesel" ? p.dieselEurPerLitre : p.petrolEurPerLitre;

export function latestFuelPrice(
  history: readonly FuelYearPrice[],
  fuel: FuelType,
): number | null {
  const latest = [...history].sort((a, b) => b.year - a.year)[0];
  return latest ? priceOf(latest, fuel) : null;
}

/** Sample standard deviation of year-over-year log returns. */
export function fuelLogVolatility(
  history: readonly FuelYearPrice[],
  fuel: FuelType,
): number {
  const prices = [...history]
    .sort((a, b) => a.year - b.year)
    .map((p) => priceOf(p, fuel));
  const returns = prices
    .slice(1)
    .map((price, i) => Math.log(price / (prices[i] ?? price)));
  if (returns.length < 2) return 0;
  const mean = returns.reduce((s, x) => s + x, 0) / returns.length;
  const variance =
    returns.reduce((s, x) => s + (x - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

/** Zero-drift lognormal walk; the -sigma^2/2 term keeps each year's mean at 1. */
function priceWalk(rng: Rng, volatility: number): number[] {
  let logFactor = 0;
  return Array.from({ length: HORIZON_YEARS }, () => {
    logFactor += volatility * standardNormal(rng) - volatility ** 2 / 2;
    return Math.exp(logFactor);
  });
}

function lognormalFactor(rng: Rng, volatility: number): number {
  return Math.exp(volatility * standardNormal(rng) - volatility ** 2 / 2);
}

export function generateScenarios(
  rng: Rng,
  fuelVolatility: number,
  assumptions: Pick<
    Assumptions,
    | "scenarioCount"
    | "electricityVolatility"
    | "mileageVolatility"
    | "residualVolatility"
  >,
): Scenario[] {
  return Array.from({ length: assumptions.scenarioCount }, () => ({
    fuelPriceFactors: priceWalk(rng, fuelVolatility),
    electricityPriceFactors: priceWalk(rng, assumptions.electricityVolatility),
    mileageFactor: lognormalFactor(rng, assumptions.mileageVolatility),
    residualFactor: lognormalFactor(rng, assumptions.residualVolatility),
  }));
}
