import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";
import { MemoryFleetRepository } from "./repositories/memory-fleet-repository.ts";
import { parseFleetFile } from "./services/parse-fleet-file.ts";
import type { ReferenceData } from "./services/reference-data.ts";

const vehicle = (id: string) => ({
  id,
  make: "Renault",
  model: "Clio",
  year: 2021,
  bodyType: "hatchback",
  fuelType: "diesel",
  seats: 5,
  annualKm: 25_000,
  maxDailyKm: 100,
  litersPer100Km: 7,
  purchasePriceEur: 25_000,
  leaseMonthlyEur: 500,
  maintenanceEurPerYear: 1000,
  insuranceEurPerYear: 800,
  leaseEndDate: "2027-06-30",
  baseCommune: "Nice",
  baseLat: 43.7,
  baseLon: 7.26,
  hasDepotCharging: true,
});
const fleetVehicles = ["a", "b", "c", "d", "e"].map(vehicle);

const reference: ReferenceData = {
  catalog: [
    {
      id: "ev1",
      modelKey: "peugeot-208",
      brand: "PEUGEOT",
      model: "208",
      variant: "e-208",
      bodyType: "BERLINE",
      segment: null,
      priceEur: 25_000,
      powerKw: 57,
      kwhPer100Km: 15,
      rangeKm: 350,
      massKg: 1500,
      group: null,
      fiscalPower: 4,
      emptyWeightKg: 1455,
      urbanRangeKm: null,
    },
  ],
  catalogSource: {
    name: "test",
    url: "https://example.test",
    sourceUpdatedAt: "2026-01-01",
  },
  stations: [
    {
      id: "s1",
      name: "S",
      address: null,
      latitude: 43.701,
      longitude: 7.261,
      chargingPoints: 2,
      maxPowerKw: 150,
    },
  ],
  fuelHistory: [
    { year: 2024, dieselEurPerLitre: 1.7, petrolEurPerLitre: 1.8 },
    { year: 2025, dieselEurPerLitre: 1.6, petrolEurPerLitre: 1.7 },
  ],
  iceReference: [],
  demoFleetRows: fleetVehicles,
};

interface FleetBody {
  fleet: { id: string; vehicleCount: number };
}

let app: FastifyInstance;

beforeEach(async () => {
  app = await buildApp({ repository: new MemoryFleetRepository(), reference });
});
afterEach(() => app.close());

const createFleet = async (): Promise<string> => {
  const response = await app.inject({
    method: "POST",
    url: "/api/fleets",
    payload: { name: "Test", vehicles: fleetVehicles },
  });
  return response.json<FleetBody>().fleet.id;
};

const multipartBody = (fileName: string, content: string) => {
  const boundary = "----fleetshift";
  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    payload: `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: text/plain\r\n\r\n${content}\r\n--${boundary}--\r\n`,
  };
};

describe("fleet routes", () => {
  it("creates, lists, reads and deletes a fleet", async () => {
    const id = await createFleet();
    const list = await app.inject({ url: "/api/fleets" });
    expect(list.json()).toHaveLength(1);
    expect((await app.inject({ url: `/api/fleets/${id}` })).statusCode).toBe(
      200,
    );
    const removed = await app.inject({
      method: "DELETE",
      url: `/api/fleets/${id}`,
    });
    expect(removed.statusCode).toBe(204);
    expect((await app.inject({ url: `/api/fleets/${id}` })).statusCode).toBe(
      404,
    );
  });

  it("returns row-level errors for an invalid fleet", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/fleets",
      payload: { name: "Bad", vehicles: [{ ...vehicle("a"), annualKm: -5 }] },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({
      error: {
        code: "invalid_fleet",
        details: { errors: [{ row: 1, field: "annualKm" }] },
      },
    });
  });

  it("uses one error format for request validation", async () => {
    const response = await app.inject({ url: "/api/fleets/not-a-uuid" });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "validation_error" },
    });
  });

  it("imports the demo fleet", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/fleets/demo",
    });
    expect(response.statusCode).toBe(201);
    expect(response.json<FleetBody>().fleet.vehicleCount).toBe(5);
  });

  it("imports a CSV upload", async () => {
    const columns = Object.keys(vehicle("a"));
    const lines = fleetVehicles.map((v) =>
      columns.map((c) => String(v[c as keyof typeof v])).join(","),
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/fleets/import",
      ...multipartBody("fleet.csv", [columns.join(","), ...lines].join("\n")),
    });
    expect(response.statusCode).toBe(201);
    expect(response.json<FleetBody>().fleet.vehicleCount).toBe(5);
  });

  it("rejects unsupported uploads", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/fleets/import",
      ...multipartBody("fleet.txt", "hello"),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: "invalid_file" } });
  });

  it("adds, updates and deletes a vehicle", async () => {
    const id = await createFleet();
    const url = `/api/fleets/${id}/vehicles`;
    const added = await app.inject({
      method: "POST",
      url,
      payload: vehicle("f"),
    });
    expect(added.statusCode).toBe(201);
    const duplicate = await app.inject({
      method: "POST",
      url,
      payload: vehicle("f"),
    });
    expect(duplicate.statusCode).toBe(409);
    const updated = await app.inject({
      method: "PUT",
      url: `${url}/f`,
      payload: { ...vehicle("f"), annualKm: 10_000 },
    });
    expect(updated.statusCode).toBe(200);
    const clash = await app.inject({
      method: "PUT",
      url: `${url}/f`,
      payload: vehicle("a"),
    });
    expect(clash.statusCode).toBe(409);
    expect(
      (await app.inject({ method: "DELETE", url: `${url}/f` })).statusCode,
    ).toBe(204);
    expect(
      (await app.inject({ method: "DELETE", url: `${url}/f` })).statusCode,
    ).toBe(404);
  });

  it("serves a CSV template", async () => {
    const response = await app.inject({ url: "/api/fleets/template.csv" });
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.body).toContain("leaseEndDate");
  });
});

describe("analysis routes", () => {
  it("runs and returns the latest analysis", async () => {
    const id = await createFleet();
    const missing = await app.inject({
      url: `/api/fleets/${id}/analyses/latest`,
    });
    expect(missing.statusCode).toBe(404);
    const run = await app.inject({
      method: "POST",
      url: `/api/fleets/${id}/analyses`,
    });
    expect(run.statusCode).toBe(201);
    const latest = await app.inject({
      url: `/api/fleets/${id}/analyses/latest`,
    });
    expect(latest.json()).toMatchObject({ fleetId: id });
  });

  it("applies saved assumptions", async () => {
    const id = await createFleet();
    const fleet = (await app.inject({ url: `/api/fleets/${id}` })).json<{
      assumptions: Record<string, unknown>;
    }>();
    const saved = await app.inject({
      method: "PUT",
      url: `/api/fleets/${id}/assumptions`,
      payload: {
        ...fleet.assumptions,
        budget2027Eur: 0,
        budget2028Eur: 0,
        scenarioCount: 10,
      },
    });
    expect(saved.statusCode).toBe(200);
    const run = await app.inject({
      method: "POST",
      url: `/api/fleets/${id}/analyses`,
    });
    const body = run.json<{
      result: { plan: { years: { vehicleIds: string[] }[] } };
    }>();
    expect(body.result.plan.years.flatMap((y) => y.vehicleIds)).toEqual([]);
  });

  it("returns 404 for an unknown fleet", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/fleets/8f14e45f-ceea-467f-a8f0-2d1b0a7c3f11/analyses",
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("reference routes", () => {
  it("returns catalog and nearby stations", async () => {
    const catalog = await app.inject({ url: "/api/catalog" });
    expect(catalog.json<{ vehicles: unknown[] }>().vehicles).toHaveLength(1);
    const stations = await app.inject({
      url: "/api/stations?lat=43.7&lon=7.26",
    });
    expect(stations.json()).toHaveLength(1);
    const invalid = await app.inject({ url: "/api/stations?lat=500&lon=7" });
    expect(invalid.statusCode).toBe(400);
  });
});

describe("parseFleetFile", () => {
  it("rejects malformed JSON and non-array JSON", () => {
    expect(() => parseFleetFile("f.json", "{")).toThrow("valid JSON");
    expect(() => parseFleetFile("f.json", "{}")).toThrow("array");
  });

  it("keeps invalid cells for row-level validation", () => {
    const [row] = parseFleetFile(
      "f.csv",
      "id,annualKm,hasDepotCharging,payloadKg\nv1,abc,yes,\n",
    );
    expect(row).toEqual({
      id: "v1",
      annualKm: "abc",
      hasDepotCharging: true,
      payloadKg: null,
    });
  });
});
