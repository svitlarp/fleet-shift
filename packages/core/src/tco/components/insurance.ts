import { HORIZON_YEARS } from "../../config/assumptions.ts";
import type { TcoComponent } from "../types.ts";

export const insuranceComponent: TcoComponent = {
  id: "insurance",
  source: "user",
  appliesTo: () => true,
  cashflows(option, ctx) {
    const factor = option.kind === "ev" ? ctx.assumptions.evInsuranceFactor : 1;
    const yearly = ctx.vehicle.insuranceEurPerYear * factor;
    return [0, ...Array<number>(HORIZON_YEARS).fill(yearly)];
  },
};
