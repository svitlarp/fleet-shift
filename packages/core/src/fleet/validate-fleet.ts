import { fleetVehicleSchema } from "../domain/schemas.ts";
import type { FleetVehicle } from "../domain/schemas.ts";
import { MAX_FLEET_SIZE, MIN_FLEET_SIZE } from "../config/assumptions.ts";

export interface FleetRowIssue {
  /** 1-based data row, excluding any CSV header. */
  row: number;
  field: string;
  message: string;
}

export interface FleetValidationResult {
  vehicles: FleetVehicle[];
  errors: FleetRowIssue[];
  warnings: FleetRowIssue[];
}

/** Validates every row and reports all problems instead of stopping at the first. */
export function validateFleet(rows: readonly unknown[]): FleetValidationResult {
  const vehicles: FleetVehicle[] = [];
  const errors: FleetRowIssue[] = [];
  const warnings: FleetRowIssue[] = [];
  const seenIds = new Set<string>();

  rows.forEach((raw, index) => {
    const row = index + 1;
    const parsed = fleetVehicleSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          row,
          field: issue.path.join(".") || "row",
          message: issue.message,
        });
      }
      return;
    }
    if (seenIds.has(parsed.data.id)) {
      errors.push({ row, field: "id", message: "Duplicate vehicle id" });
      return;
    }
    seenIds.add(parsed.data.id);
    vehicles.push(parsed.data);
  });

  if (rows.length < MIN_FLEET_SIZE || rows.length > MAX_FLEET_SIZE) {
    warnings.push({
      row: 0,
      field: "fleet",
      message: `Fleet size ${String(rows.length)} is outside the supported ${String(MIN_FLEET_SIZE)}-${String(MAX_FLEET_SIZE)} range`,
    });
  }
  return { vehicles, errors, warnings };
}
