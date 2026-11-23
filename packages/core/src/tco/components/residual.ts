import { HORIZON_YEARS } from "../../config/assumptions.ts";
import type { TcoComponent } from "../types.ts";

/** Resale revenue when buying; under a lease it is already priced into the rent. */
export const residualComponent: TcoComponent = {
  id: "residual",
  source: "assumption",
  appliesTo: (_option, ctx) => ctx.assumptions.financingMode === "purchase",
  cashflows(option, ctx, scenario) {
    const a = ctx.assumptions;
    const value =
      option.kind === "ev"
        ? option.ev.priceEur * a.evResidualShare * scenario.residualFactor
        : ctx.vehicle.purchasePriceEur * a.iceResidualShare;
    const flows = Array<number>(HORIZON_YEARS + 1).fill(0);
    flows[HORIZON_YEARS] = -value;
    return flows;
  },
};
