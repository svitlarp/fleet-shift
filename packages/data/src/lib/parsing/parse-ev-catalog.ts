import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import type { Parser } from "csv-parse";
import type {
  CatalogVehicle,
  ParseEVCatalogStats,
} from "../../types/parser-ev-catalog.ts";
import { cleanEVRows } from "./clean-ev-catalog.ts";
import type { CSVRow } from "./clean-ev-catalog.ts";

export async function parseEVCatalog(
  filePath: string,
): Promise<{ vehicles: CatalogVehicle[]; stats: ParseEVCatalogStats }> {
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
  return cleanEVRows(rows);
}
