const eur = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const percent = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 0,
});

export const formatEur = (value: number): string => eur.format(value);
export const formatPercent = (value: number): string => percent.format(value);
