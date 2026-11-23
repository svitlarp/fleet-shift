import { createHash } from "node:crypto";
import type {
  CatalogVehicle,
  ParseEVCatalogStats,
} from "../../types/parser-ev-catalog.ts";

export type CSVRow = Record<string, string | undefined>;

export function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined) return null;

  // ADEME uses French decimals and may group thousands with spaces.
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return null;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function positiveValues(...values: (number | null)[]): number[] {
  return values.filter((v): v is number => v !== null && v > 0);
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Maps one ADEME row to a catalog entry, or null when a value needed for
 * matching or TCO is missing. ADEME's Min/Max range columns are often inverted,
 * so the lowest range and highest consumption are kept as the prudent values.
 */
export function toCatalogVehicle(row: CSVRow): CatalogVehicle | null {
  const brand = row.Marque?.trim();
  const model = row["Modèle"]?.trim();
  const variant = row["Description Commerciale"]?.trim();
  const bodyType = row.Carrosserie?.trim();
  const priceEur = toNumberOrNull(row["Prix véhicule"]);
  const ranges = positiveValues(
    toNumberOrNull(row["Autonomie elec Min"]),
    toNumberOrNull(row["Autonomie elec Max"]),
  );
  const consumptionsWhPerKm = positiveValues(
    toNumberOrNull(row["Conso elec Min"]),
    toNumberOrNull(row["Conso elec Max"]),
  );

  if (!brand || !model || !variant || !bodyType) return null;
  if (priceEur === null || priceEur <= 0) return null;
  if (ranges.length === 0 || consumptionsWhPerKm.length === 0) return null;

  const rangeKm = Math.min(...ranges);
  const kwhPer100Km = Number(
    (Math.max(...consumptionsWhPerKm) / 10).toFixed(2),
  );
  const identity = [
    brand,
    model,
    variant,
    bodyType,
    priceEur,
    kwhPer100Km,
    rangeKm,
  ].join("|");
  const shortHash = createHash("sha256")
    .update(identity)
    .digest("hex")
    .slice(0, 6);

  return {
    id: `${slug(`${brand}-${variant}`)}-${shortHash}`,
    brand,
    model,
    variant,
    bodyType,
    segment: row.Gamme?.trim() ?? null,
    priceEur,
    powerKw: toNumberOrNull(row["Puissance nominale électrique"]),
    kwhPer100Km,
    rangeKm,
    massKg: toNumberOrNull(row["Masse OM Max"]),
  };
}

export function cleanEVRows(rows: CSVRow[]): {
  vehicles: CatalogVehicle[];
  stats: ParseEVCatalogStats;
} {
  const byId = new Map<string, CatalogVehicle>();
  let electricRows = 0;
  let rejectedIncomplete = 0;

  for (const row of rows) {
    if (row.Energie !== "ELECTRIC") continue;
    electricRows++;
    const vehicle = toCatalogVehicle(row);
    if (vehicle === null) {
      rejectedIncomplete++;
      continue;
    }
    if (!byId.has(vehicle.id)) byId.set(vehicle.id, vehicle);
  }

  const vehicles = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {
    vehicles,
    stats: {
      electricRows,
      rejectedIncomplete,
      duplicatesRemoved: electricRows - rejectedIncomplete - vehicles.length,
    },
  };
}
