import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import type { Parser } from "csv-parse";
import { referenceKey } from "@fleetshift/core";
import type { IceReferenceEntry } from "@fleetshift/core";
import { toNumberOrNull } from "./clean-ev-catalog.ts";
import type { CSVRow } from "./clean-ev-catalog.ts";

const FUEL_BY_ENERGY: Readonly<Record<string, "diesel" | "petrol">> = {
  GAZOLE: "diesel",
  ESSENCE: "petrol",
};

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 1
    ? upper
    : ((sorted[middle - 1] ?? upper) + upper) / 2;
}

/** Aggregates combustion rows into median new prices per model, by fuel and overall. */
export function buildIceReference(
  rows: readonly CSVRow[],
): IceReferenceEntry[] {
  const prices = new Map<string, number[]>();
  const add = (key: string, price: number) => {
    prices.set(key, [...(prices.get(key) ?? []), price]);
  };

  for (const row of rows) {
    const fuelType = FUEL_BY_ENERGY[row.Energie ?? ""];
    const price = toNumberOrNull(row["Prix véhicule"]);
    const makeKey = referenceKey(row.Marque ?? "");
    const modelKey = referenceKey(row["Modèle"] ?? "");
    if (!fuelType || price === null || price <= 0 || !makeKey || !modelKey) {
      continue;
    }
    add(`${makeKey}|${modelKey}|${fuelType}`, price);
    add(`${makeKey}|${modelKey}|any`, price);
  }

  return [...prices.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => {
      const [makeKey = "", modelKey = "", fuelType = "any"] = key.split("|");
      return {
        makeKey,
        modelKey,
        fuelType: fuelType as IceReferenceEntry["fuelType"],
        medianPriceEur: median(values),
        rowCount: values.length,
      };
    });
}

export async function parseIceReference(
  filePath: string,
): Promise<IceReferenceEntry[]> {
  const rows: CSVRow[] = [];
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
    rows.push(row);
  }
  return buildIceReference(rows);
}
