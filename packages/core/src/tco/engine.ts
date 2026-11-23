import { HORIZON_YEARS } from "../config/assumptions.ts";
import { DEFAULT_TCO_COMPONENTS } from "./registry.ts";
import type {
  Scenario,
  TcoComponent,
  TcoContext,
  TcoOption,
  TcoResult,
} from "./types.ts";

export const CENTRAL_SCENARIO: Scenario = {
  fuelPriceFactors: Array<number>(HORIZON_YEARS).fill(1),
  electricityPriceFactors: Array<number>(HORIZON_YEARS).fill(1),
  mileageFactor: 1,
  residualFactor: 1,
};

/** TCO = sum over t = 0..5 of component cash flows / (1 + r)^t, in real EUR. */
export function computeTco(
  option: TcoOption,
  ctx: TcoContext,
  scenario: Scenario = CENTRAL_SCENARIO,
  components: readonly TcoComponent[] = DEFAULT_TCO_COMPONENTS,
): TcoResult {
  const cashflowEur = Array<number>(HORIZON_YEARS + 1).fill(0);
  const breakdown: TcoResult["breakdown"] = {};
  const provenance: TcoResult["provenance"] = {};
  const r = ctx.assumptions.discountRate;

  for (const component of components) {
    if (!component.appliesTo(option, ctx)) continue;
    const flows = component.cashflows(option, ctx, scenario);
    let discounted = 0;
    for (let t = 0; t <= HORIZON_YEARS; t++) {
      const flow = flows[t] ?? 0;
      cashflowEur[t] = (cashflowEur[t] ?? 0) + flow;
      discounted += flow / (1 + r) ** t;
    }
    breakdown[component.id] = discounted;
    provenance[component.id] = component.source;
  }

  const totalEur = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const totalKm = ctx.vehicle.annualKm * scenario.mileageFactor * HORIZON_YEARS;
  return {
    totalEur,
    perKmEur: totalKm > 0 ? totalEur / totalKm : 0,
    breakdown,
    cashflowEur,
    provenance,
  };
}
