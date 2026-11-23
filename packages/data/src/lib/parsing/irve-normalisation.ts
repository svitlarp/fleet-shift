import { PACA_BOUNDS } from "../../config/regions.ts";

const MAX_PLAUSIBLE_POWER_KW = 1000;

/** IRVE declares kW, but some operators publish watts; those are converted. */
export function normalizePowerKw(value: string): number | null {
  const power = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(power) || power <= 0) return null;
  return power > MAX_PLAUSIBLE_POWER_KW ? power / 1000 : power;
}

export function isInPacaBounds(
  latitude: number | null,
  longitude: number | null,
): boolean {
  if (latitude === null || longitude === null) return false;
  return (
    latitude >= PACA_BOUNDS.minLatitude &&
    latitude <= PACA_BOUNDS.maxLatitude &&
    longitude >= PACA_BOUNDS.minLongitude &&
    longitude <= PACA_BOUNDS.maxLongitude
  );
}
