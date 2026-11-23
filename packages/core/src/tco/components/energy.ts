import { HORIZON_YEARS } from "../../config/assumptions.ts";
import type { Assumptions } from "../../config/assumptions.ts";
import type { TcoComponent } from "../types.ts";

/** depot * s + (1 - s) * (fast * DC + (1 - fast) * AC), in EUR/kWh. */
export function blendedElectricityEurPerKwh(
  hasDepotCharging: boolean,
  a: Pick<
    Assumptions,
    | "depotChargingShare"
    | "publicFastShare"
    | "depotTariffEurPerKwh"
    | "publicAcTariffEurPerKwh"
    | "publicDcTariffEurPerKwh"
  >,
): number {
  const depotShare = hasDepotCharging ? a.depotChargingShare : 0;
  const publicPrice =
    a.publicFastShare * a.publicDcTariffEurPerKwh +
    (1 - a.publicFastShare) * a.publicAcTariffEurPerKwh;
  return depotShare * a.depotTariffEurPerKwh + (1 - depotShare) * publicPrice;
}

export const energyComponent: TcoComponent = {
  id: "energy",
  source: "open_data",
  appliesTo: () => true,
  cashflows(option, ctx, scenario) {
    const km = ctx.vehicle.annualKm * scenario.mileageFactor;
    const yearly = Array.from({ length: HORIZON_YEARS }, (_, year) => {
      if (option.kind === "baseline") {
        const factor = scenario.fuelPriceFactors[year] ?? 1;
        return (
          (km / 100) *
          ctx.vehicle.litersPer100Km *
          ctx.fuelPriceEurPerLitre *
          factor
        );
      }
      const factor = scenario.electricityPriceFactors[year] ?? 1;
      return (
        (km / 100) *
        option.ev.kwhPer100Km *
        ctx.assumptions.realWorldConsumptionFactor *
        blendedElectricityEurPerKwh(
          ctx.vehicle.hasDepotCharging,
          ctx.assumptions,
        ) *
        factor
      );
    });
    return [0, ...yearly];
  },
};
