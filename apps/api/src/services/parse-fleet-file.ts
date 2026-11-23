import { parse } from "csv-parse/sync";
import { fleetVehicleSchema, normalizeFleetRow } from "@fleetshift/core";
import { ApiError } from "../lib/api-error.ts";

const BOOLEAN_FIELDS = new Set(["hasDepotCharging"]);
const TEXT_FIELDS = new Set([
  "id",
  "make",
  "model",
  "bodyType",
  "fuelType",
  "leaseEndDate",
  "baseCommune",
]);
const NULLABLE_FIELDS = new Set(["cargoVolumeM3", "payloadKg"]);

export const FLEET_CSV_COLUMNS = Object.keys(fleetVehicleSchema.shape);

function coerceCell(field: string, raw: string): unknown {
  const value = raw.trim();
  if (TEXT_FIELDS.has(field)) return value;
  if (value === "" && NULLABLE_FIELDS.has(field)) return null;
  if (BOOLEAN_FIELDS.has(field)) {
    const lower = value.toLowerCase();
    if (["true", "yes", "1"].includes(lower)) return true;
    if (["false", "no", "0"].includes(lower)) return false;
    return value;
  }
  const number = Number(value.replace(",", "."));
  return value !== "" && Number.isFinite(number) ? number : value;
}

export function parseFleetCsv(content: string): unknown[] {
  let records: Record<string, string>[];
  try {
    records = parse(content, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: [",", ";"],
    });
  } catch (error) {
    throw new ApiError(
      400,
      "invalid_file",
      error instanceof Error ? error.message : "Could not read CSV",
    );
  }
  return records.map((record) =>
    Object.fromEntries(
      Object.entries(record).map(([field, value]) => [
        field,
        coerceCell(field, value),
      ]),
    ),
  );
}

export function parseFleetFile(fileName: string, content: string): unknown[] {
  if (fileName.toLowerCase().endsWith(".csv")) return parseFleetCsv(content);
  if (!fileName.toLowerCase().endsWith(".json")) {
    throw new ApiError(400, "invalid_file", "Upload a .csv or .json file");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ApiError(400, "invalid_file", "File is not valid JSON");
  }
  if (!Array.isArray(parsed)) {
    throw new ApiError(
      400,
      "invalid_file",
      "JSON must be an array of vehicles",
    );
  }
  return parsed.map(normalizeFleetRow);
}
