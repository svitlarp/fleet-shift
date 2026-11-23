import { HORIZON_YEARS } from "../../config/assumptions.ts";
import type { TcoComponent, TcoContext, TcoOption } from "../types.ts";

/**
 * Annuity with a balloon: (P - RV / (1+i)^n) * i / (1 - (1+i)^-n).
 * P and RV in EUR, i is the monthly rate, n the number of months.
 */
export function monthlyLeaseEur(
  priceEur: number,
  residualEur: number,
  annualRate: number,
  months: number,
): number {
  const i = annualRate / 12;
  if (i === 0) return (priceEur - residualEur) / months;
  const discountedResidual = residualEur / (1 + i) ** months;
  return ((priceEur - discountedResidual) * i) / (1 - (1 + i) ** -months);
}

export function evMonthlyLeaseEur(
  priceEur: number,
  ctx: Pick<TcoContext, "assumptions">,
): number {
  const a = ctx.assumptions;
  return monthlyLeaseEur(
    priceEur,
    priceEur * a.evResidualShare,
    a.leaseAnnualRate,
    a.evLeaseMonths,
  );
}

/** The baseline uses the same annuity as EVs, so both are priced like-for-like. */
export function baselineMonthlyLeaseEur(
  ctx: Pick<TcoContext, "assumptions" | "baselinePriceEur">,
): number {
  const a = ctx.assumptions;
  return monthlyLeaseEur(
    ctx.baselinePriceEur,
    ctx.baselinePriceEur * a.iceResidualShare,
    a.leaseAnnualRate,
    a.evLeaseMonths,
  );
}

function optionPriceEur(option: TcoOption, ctx: TcoContext): number {
  return option.kind === "ev" ? option.ev.priceEur : ctx.baselinePriceEur;
}

export const financingComponent: TcoComponent = {
  id: "financing",
  source: "assumption",
  appliesTo: () => true,
  cashflows(option, ctx) {
    if (ctx.assumptions.financingMode === "purchase") {
      return [
        optionPriceEur(option, ctx),
        ...Array<number>(HORIZON_YEARS).fill(0),
      ];
    }
    const monthly =
      option.kind === "ev"
        ? evMonthlyLeaseEur(option.ev.priceEur, ctx)
        : baselineMonthlyLeaseEur(ctx);
    return [0, ...Array<number>(HORIZON_YEARS).fill(monthly * 12)];
  },
};
