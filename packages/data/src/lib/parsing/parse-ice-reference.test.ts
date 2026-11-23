import { describe, expect, it } from "vitest";
import { buildIceReference } from "./parse-ice-reference.ts";

const row = (energy: string, price: string) => ({
  Marque: "RENAULT",
  Modèle: "MÉGANE",
  Energie: energy,
  "Prix véhicule": price,
});

describe("buildIceReference", () => {
  it("computes medians by fuel and overall, ignoring other energies", () => {
    const entries = buildIceReference([
      row("GAZOLE", "30000"),
      row("GAZOLE", "32000"),
      row("ESSENCE", "26000"),
      row("ELECTRIC", "40000"),
      row("ESSENCE", ""),
    ]);
    const price = (fuel: string) =>
      entries.find((e) => e.fuelType === fuel)?.medianPriceEur;
    expect(entries[0]).toMatchObject({
      makeKey: "RENAULT",
      modelKey: "MEGANE",
    });
    expect(price("diesel")).toBe(31_000);
    expect(price("petrol")).toBe(26_000);
    expect(price("any")).toBe(30_000);
  });
});
