import type { Assumptions } from "../config/assumptions.ts";
import type { EvModel, FleetVehicle } from "../domain/schemas.ts";
import type { ChargingAccess } from "./charging-access.ts";

export type RejectionReason =
  "body_type" | "seats" | "cargo_data_missing" | "winter_range";

const VAN_BODIES = new Set(["COMBISPACE", "MINIBUS"]);
const DEFAULT_SEATS_BY_BODY: Readonly<Record<string, number>> = { MINIBUS: 8 };
const FOUR_SEAT_MODELS = new Set([
  "FIAT 500",
  "HONDA E",
  "MINI MINI",
  "RENAULT TWINGO",
  "DACIA SPRING",
]);

/** ADEME has no seat count, so seats are an assumption from body and model. */
export function assumedSeats(
  ev: Pick<EvModel, "brand" | "model" | "bodyType">,
): number {
  if (FOUR_SEAT_MODELS.has(`${ev.brand} ${ev.model}`)) return 4;
  return DEFAULT_SEATS_BY_BODY[ev.bodyType] ?? 5;
}

/** Battery size when ADEME states it in the variant name, otherwise null. */
export function batteryKwhFromVariant(variant: string): number | null {
  const match = /(\d+(?:[.,]\d+)?)\s*kWh/i.exec(variant);
  return match?.[1] ? Number(match[1].replace(",", ".")) : null;
}

export function requiredWltpRangeKm(
  maxDailyKm: number,
  access: Pick<ChargingAccess, "hasReliableCharging">,
  assumptions: Pick<
    Assumptions,
    "rangeReserve" | "rangeReserveNoCharging" | "winterRangeFactor"
  >,
): number {
  const reserve = access.hasReliableCharging
    ? assumptions.rangeReserve
    : assumptions.rangeReserveNoCharging;
  return (maxDailyKm * (1 + reserve)) / assumptions.winterRangeFactor;
}

export function findRejection(
  vehicle: FleetVehicle,
  ev: EvModel,
  access: ChargingAccess,
  assumptions: Assumptions,
): RejectionReason | null {
  const isVan = vehicle.bodyType === "van";
  if (isVan && !VAN_BODIES.has(ev.bodyType)) return "body_type";
  if (!isVan && ev.bodyType === "MINIBUS" && vehicle.seats <= 5) {
    return "body_type";
  }
  if (assumedSeats(ev) < vehicle.seats) return "seats";
  if (vehicle.cargoVolumeM3 !== null || vehicle.payloadKg !== null) {
    return "cargo_data_missing";
  }
  const requiredKm = requiredWltpRangeKm(
    vehicle.maxDailyKm,
    access,
    assumptions,
  );
  return ev.rangeKm < requiredKm ? "winter_range" : null;
}
