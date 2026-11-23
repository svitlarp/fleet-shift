import { describe, expect, it } from "vitest";
import {
  cleanEVRows,
  cleanText,
  toCatalogVehicle,
  toNumberOrNull,
} from "./clean-ev-catalog.ts";
import type { CSVRow } from "./clean-ev-catalog.ts";
import { isInPacaBounds, normalizePowerKw } from "./irve-normalisation.ts";

const row = (overrides: CSVRow = {}): CSVRow => ({
  Marque: "OPEL",
  Modèle: "CORSA",
  "Description Commerciale": "CORSA-E (57Kw)",
  Energie: "ELECTRIC",
  Carrosserie: "BERLINE",
  Gamme: "ECONOMIQUE",
  "Prix véhicule": "37600",
  "Puissance nominale électrique": "57,000",
  "Conso elec Min": "149,800",
  "Conso elec Max": "161,500",
  "Autonomie elec Min": "373,000",
  "Autonomie elec Max": "346,000",
  "Masse OM Max": "1530",
  ...overrides,
});

describe("toCatalogVehicle", () => {
  it("keeps the lowest range and highest consumption", () => {
    expect(toCatalogVehicle(row())).toMatchObject({
      rangeKm: 346,
      kwhPer100Km: 16.15,
      powerKw: 57,
    });
  });

  it("uses the single value when the other is missing", () => {
    const v = toCatalogVehicle(
      row({ "Conso elec Min": "", "Autonomie elec Min": "" }),
    );
    expect(v).toMatchObject({ rangeKm: 346, kwhPer100Km: 16.15 });
  });

  it("rejects rows without price, range or consumption", () => {
    expect(toCatalogVehicle(row({ "Prix véhicule": "" }))).toBeNull();
    expect(
      toCatalogVehicle(
        row({ "Autonomie elec Min": "", "Autonomie elec Max": "" }),
      ),
    ).toBeNull();
    expect(
      toCatalogVehicle(row({ "Conso elec Min": "0", "Conso elec Max": "" })),
    ).toBeNull();
  });
});

describe("cleanEVRows", () => {
  it("removes duplicates, keeps distinct configs and ignores non-electric rows", () => {
    const { vehicles, stats } = cleanEVRows([
      row(),
      row(),
      row({ "Prix véhicule": "36000" }),
      row({ Energie: "ESSENCE" }),
      row({ "Prix véhicule": "" }),
    ]);
    expect(vehicles).toHaveLength(2);
    expect(stats).toEqual({
      electricRows: 4,
      rejectedIncomplete: 1,
      duplicatesRemoved: 1,
    });
  });

  it("creates stable ids", () => {
    expect(toCatalogVehicle(row())?.id).toBe(toCatalogVehicle(row())?.id);
  });
});

describe("parsing helpers", () => {
  it("repairs broken accents and spacing", () => {
    expect(cleanText("500e Ã©lectrique")).toBe("500e électrique");
    expect(cleanText("63kWhÂ\u00a0 ENGAGEÂ\u00a0Â\u00a0")).toBe("63kWh ENGAGE");
    expect(cleanText("ZOE (51Kw)")).toBe("ZOE (51Kw)");
  });

  it("parses French numbers", () => {
    expect(toNumberOrNull("1 234,5")).toBe(1234.5);
    expect(toNumberOrNull("n/a")).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
  });

  it("normalizes charger power to kW", () => {
    expect(normalizePowerKw("22")).toBe(22);
    expect(normalizePowerKw("22000")).toBe(22);
    expect(normalizePowerKw("")).toBeNull();
  });

  it("checks PACA bounds", () => {
    expect(isInPacaBounds(43.7, 7.26)).toBe(true);
    expect(isInPacaBounds(49.24, 2.46)).toBe(false);
    expect(isInPacaBounds(null, 7.26)).toBe(false);
  });
});
