import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import type { Parser } from "csv-parse";
import type { EVStation, ParseIRVEResult } from "../../types/parser-irve.ts";
import {
  columnsNameIRVESchema,
  columnsNameIRVEConsolidation,
} from "./columns-name-irve-schema.ts";
import { isInPacaBounds, normalizePowerKw } from "./irve-normalisation.ts";

const ALL_COLUMNS = [
  ...columnsNameIRVESchema,
  ...columnsNameIRVEConsolidation,
] as const;
type ColumnName = (typeof ALL_COLUMNS)[number];

const EXPECTED_COLUMNS = ALL_COLUMNS.length; // 49

const INDEX = Object.fromEntries(
  ALL_COLUMNS.map((name, i) => [name, i]),
) as Record<ColumnName, number>;

function field(row: string[], name: ColumnName): string {
  return row[INDEX[name]]?.trim() ?? "";
}

function toNumberOrNull(value: string): number | null {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseCoordinatesXY(
  value: string,
): { longitude: number; latitude: number } | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      typeof parsed[0] === "number" &&
      typeof parsed[1] === "number"
    ) {
      return { longitude: parsed[0], latitude: parsed[1] };
    }
  } catch {
    // invalid JSON -> missing coordinates
  }
  return null;
}

interface StationData {
  name: string | null;
  address: string | null;
  longitude: number | null;
  latitude: number | null;
  openingHours: string | null;
  access: string | null;
  commissionedDate: string | null;
  declaredChargingPoints: number | null;
  chargingPointIds: Set<string>;
  maxPowerKw: number | null;
}

export async function parseIRVE(
  filePath: string,
  allowedDepartments: readonly string[],
): Promise<ParseIRVEResult> {
  const stations = new Map<string, StationData>();
  const statusCounts = new Map<string, number>();
  let rowsBadLength = 0;
  let rowsWithoutInsee = 0;

  // We check the length ourselves (see EXPECTED_COLUMNS) instead of
  // trusting the parser, because this file has stray lines at the top.
  const parser: Parser = parse({
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const input = createReadStream(filePath);
  input.on("error", (err) => {
    parser.destroy(err);
  });
  input.pipe(parser);

  for await (const row of parser as AsyncIterable<string[]>) {
    if (row.length !== EXPECTED_COLUMNS) {
      rowsBadLength++;
      continue;
    }

    const id = field(row, "id_station_itinerance");
    if (!id) continue;

    const insee = field(row, "code_insee_commune");
    if (!insee) {
      rowsWithoutInsee++;
      continue;
    }
    if (!allowedDepartments.includes(insee.slice(0, 2))) continue;

    const status = field(row, "consolidation_status");
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

    let station = stations.get(id);
    if (!station) {
      // Prefer coordinates corrected by PAN, fall back to the original coordonneesXY if no consolidated coordinates
      const fallback = parseCoordinatesXY(field(row, "coordonneesXY"));
      const lon =
        toNumberOrNull(field(row, "consolidated_longitude")) ??
        fallback?.longitude ??
        null;
      const lat =
        toNumberOrNull(field(row, "consolidated_latitude")) ??
        fallback?.latitude ??
        null;

      station = {
        name: field(row, "nom_station") || null,
        address: field(row, "adresse_station") || null,
        longitude: lon,
        latitude: lat,
        openingHours: field(row, "horaires") || null,
        access: field(row, "condition_acces") || null,
        commissionedDate: field(row, "date_mise_en_service") || null,
        declaredChargingPoints: toIntOrNull(field(row, "nbre_pdc")),
        chargingPointIds: new Set(),
        maxPowerKw: null,
      };
      stations.set(id, station);
    }

    const pdcId = field(row, "id_pdc_itinerance");
    if (pdcId) station.chargingPointIds.add(pdcId);

    const powerKw = normalizePowerKw(field(row, "puissance_nominale"));
    if (powerKw !== null) {
      station.maxPowerKw = Math.max(station.maxPowerKw ?? 0, powerKw);
    }
  }

  const allStations: EVStation[] = [...stations.entries()]
    .map(([id, s]) => ({
      id,
      name: s.name,
      address: s.address,
      longitude: s.longitude,
      latitude: s.latitude,
      openingHours: s.openingHours,
      access: s.access,
      commissionedDate: s.commissionedDate,
      chargingPoints: s.chargingPointIds.size,
      declaredChargingPoints: s.declaredChargingPoints,
      maxPowerKw: s.maxPowerKw,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const evStations = allStations.filter((s) =>
    isInPacaBounds(s.latitude, s.longitude),
  );
  const withoutCoords = allStations.filter((s) => s.longitude === null).length;
  console.log(`Stations in PACA: ${String(evStations.length)}`);
  console.log(
    `Rows with unexpected length (skipped): ${String(rowsBadLength)}`,
  );
  console.log(`Rows skipped (no INSEE code): ${String(rowsWithoutInsee)}`);
  console.log(`Stations without coordinates: ${String(withoutCoords)}`);
  console.log(
    `Stations outside PACA bounds (dropped): ${String(allStations.length - evStations.length)}`,
  );
  console.log("Consolidation status values:", Object.fromEntries(statusCounts));

  return { evStations, totalevStationsPACA: evStations.length };
}
