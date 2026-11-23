import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import type { Parser } from "csv-parse";
import type { Vehicle, EVCatalog } from "../../types/parser-ev-catalog.ts";

type CSVRow = Record<string, string>;

function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined) return null;

  // Strip spaces from parsed values to preserve the full number and converts comma to point
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return null;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export async function parseEVCatalog(filePath: string): Promise<EVCatalog> {
  const evCatalog: EVCatalog = [];
  let id = 1;

  const parser: Parser = parse({
    bom: true,
    skip_empty_lines: true,
    columns: true,
    delimiter: ";",
  });

  const input = createReadStream(filePath);
  input.on("error", (err) => {
    parser.destroy(err);
  });
  input.pipe(parser);

  for await (const row of parser as AsyncIterable<CSVRow>) {
    if (row["Energie"] !== "ELECTRIC") continue;
    const autonomieMin = toNumberOrNull(row["Autonomie elec Min"]);
    const autonomieMax = toNumberOrNull(row["Autonomie elec Max"]);
    const consoElecMin = toNumberOrNull(row["Conso elec Min"]);
    const consoElecMax = toNumberOrNull(row["Conso elec Max"]);
    const rangeKm =
      autonomieMax !== null && autonomieMin !== null
        ? Math.min(autonomieMin, autonomieMax)
        : null;
    const kwhPer100km =
      consoElecMin !== null && consoElecMax !== null
        ? Number((Math.max(consoElecMin, consoElecMax) / 10).toFixed(2))
        : null;

    const vehicle: Vehicle = {
      id: id,
      brand: row["Marque"] || null,
      model: row["Modèle"] || null,
      energie: row["Energie"],
      variant: row["Description Commerciale"] || null,
      bodyType: row["Carrosserie"] || null,
      segment: row["Gamme"] || null,
      priceEur: toNumberOrNull(row["Prix véhicule"]),
      powerKw: toNumberOrNull(row["Puissance nominale électrique"]),
      consoElecMin: toNumberOrNull(row["Conso elec Min"]) || null,
      consoElecMax: toNumberOrNull(row["Conso elec Max"]) || null,
      kwhPer100km,
      autonomieMax: toNumberOrNull(row["Autonomie elec Max"]) || null,
      autonomieMin: toNumberOrNull(row["Autonomie elec Min"]) || null,
      rangeKm,
      co2GkmMin: toNumberOrNull(row["CO2 haute vitesse Min"]),
      co2GkmMax: toNumberOrNull(row["CO2 haute vitesse Max"]),
    };
    evCatalog.push(vehicle);
    id++;
  }
  return evCatalog;
}
