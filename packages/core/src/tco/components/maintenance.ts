import { HORIZON_YEARS } from "../../config/assumptions.ts";
import type { TcoComponent } from "../types.ts";

export const maintenanceComponent: TcoComponent = {
  id: "maintenance",
  source: "user",
  appliesTo: () => true,
  cashflows(option, ctx, scenario) {
    const factor =
      option.kind === "ev" ? ctx.assumptions.evMaintenanceFactor : 1;
    const yearly =
      ctx.vehicle.maintenanceEurPerYear * factor * scenario.mileageFactor;
    return [0, ...Array<number>(HORIZON_YEARS).fill(yearly)];
  },
};
