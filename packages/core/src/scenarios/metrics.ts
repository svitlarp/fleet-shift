export interface SavingsMetrics {
  medianEur: number;
  p10Eur: number;
  p90Eur: number;
  paybackShare: number;
  /** Mean of the worst 10 % of outcomes. */
  cvar10Eur: number;
}

/** Linear-interpolation quantile of an ascending array; q in [0, 1]. */
export function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const a = sorted[lower] ?? 0;
  const b = sorted[upper] ?? a;
  return a + (b - a) * (position - lower);
}

export function summarizeSavings(
  savingsEur: readonly number[],
): SavingsMetrics {
  const sorted = [...savingsEur].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return {
      medianEur: 0,
      p10Eur: 0,
      p90Eur: 0,
      paybackShare: 0,
      cvar10Eur: 0,
    };
  }
  const tailSize = Math.max(1, Math.ceil(sorted.length * 0.1));
  const tail = sorted.slice(0, tailSize);
  return {
    medianEur: quantile(sorted, 0.5),
    p10Eur: quantile(sorted, 0.1),
    p90Eur: quantile(sorted, 0.9),
    paybackShare: sorted.filter((s) => s > 0).length / sorted.length,
    cvar10Eur: tail.reduce((s, x) => s + x, 0) / tail.length,
  };
}
