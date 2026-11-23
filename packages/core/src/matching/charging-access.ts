import type { Assumptions } from "../config/assumptions.ts";
import type { ChargingStation, FleetVehicle } from "../domain/schemas.ts";
import { stationsWithinRadius } from "../geo/haversine.ts";

export interface ChargingAccess {
  hasDepotCharging: boolean;
  stationsInRadius: number;
  fastStationsInRadius: number;
  nearestStationKm: number | null;
  /** 0-1; depot charging scores 1, otherwise five fast-equivalent stations score 1. */
  score: number;
  hasReliableCharging: boolean;
}

const SLOW_STATION_WEIGHT = 0.25;
const FULL_SCORE_STATIONS = 5;

export function assessChargingAccess(
  vehicle: Pick<FleetVehicle, "baseLat" | "baseLon" | "hasDepotCharging">,
  stations: readonly ChargingStation[],
  assumptions: Pick<Assumptions, "chargingRadiusKm" | "fastChargerMinKw">,
): ChargingAccess {
  const nearby = stationsWithinRadius(
    vehicle.baseLat,
    vehicle.baseLon,
    stations,
    assumptions.chargingRadiusKm,
  );
  const fast = nearby.filter(
    (s) => (s.station.maxPowerKw ?? 0) >= assumptions.fastChargerMinKw,
  ).length;
  const slow = nearby.length - fast;
  const score = vehicle.hasDepotCharging
    ? 1
    : Math.min(1, (fast + slow * SLOW_STATION_WEIGHT) / FULL_SCORE_STATIONS);

  return {
    hasDepotCharging: vehicle.hasDepotCharging,
    stationsInRadius: nearby.length,
    fastStationsInRadius: fast,
    nearestStationKm: nearby[0]?.distanceKm ?? null,
    score,
    hasReliableCharging: vehicle.hasDepotCharging || fast > 0,
  };
}
