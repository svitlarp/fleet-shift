import type { ChargingStation } from "../domain/schemas.ts";

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance in km (haversine formula). */
export function distanceKm(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) *
      Math.cos(toRadians(latB)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface StationDistance {
  station: ChargingStation;
  distanceKm: number;
}

export function stationsWithinRadius(
  lat: number,
  lon: number,
  stations: readonly ChargingStation[],
  radiusKm: number,
): StationDistance[] {
  return stations
    .map((station) => ({
      station,
      distanceKm: distanceKm(lat, lon, station.latitude, station.longitude),
    }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
