import { describe, expect, it } from "vitest";
import { distanceKm, stationsWithinRadius } from "../geo/haversine.ts";
import {
  assumptionsFixture,
  evFixture,
  stationFixture,
  vehicleFixture,
} from "../test-fixtures.ts";
import { assessChargingAccess } from "./charging-access.ts";
import type { ChargingAccess } from "./charging-access.ts";
import {
  assumedSeats,
  findRejection,
  requiredWltpRangeKm,
} from "./hard-filters.ts";

const a = assumptionsFixture();
const reliable: ChargingAccess = {
  hasDepotCharging: false,
  stationsInRadius: 1,
  fastStationsInRadius: 1,
  nearestStationKm: 1,
  score: 0.2,
  hasReliableCharging: true,
};

describe("geo", () => {
  it("computes Nice to Marseille at about 159 km", () => {
    expect(distanceKm(43.7102, 7.262, 43.2965, 5.3698)).toBeCloseTo(159, 0);
  });

  it("returns nearby stations sorted by distance", () => {
    const near = stationFixture({ id: "near", latitude: 43.7001 });
    const mid = stationFixture({ id: "mid", latitude: 43.72 });
    const far = stationFixture({ id: "far", latitude: 44.5 });
    const found = stationsWithinRadius(43.7, 7.26, [mid, far, near], 10);
    expect(found.map((s) => s.station.id)).toEqual(["near", "mid"]);
  });
});

describe("assessChargingAccess", () => {
  it("scores depot charging as full access", () => {
    const access = assessChargingAccess(
      vehicleFixture({ hasDepotCharging: true }),
      [],
      a,
    );
    expect(access.score).toBe(1);
    expect(access.nearestStationKm).toBeNull();
  });

  it("needs a fast station for reliable public charging", () => {
    const slow = stationFixture({ maxPowerKw: 22 });
    expect(
      assessChargingAccess(vehicleFixture(), [slow], a).hasReliableCharging,
    ).toBe(false);
    expect(
      assessChargingAccess(vehicleFixture(), [stationFixture()], a)
        .hasReliableCharging,
    ).toBe(true);
  });
});

describe("findRejection", () => {
  it("accepts a suitable EV", () => {
    expect(
      findRejection(vehicleFixture(), evFixture(), reliable, a),
    ).toBeNull();
  });

  it("rejects insufficient winter range at the boundary", () => {
    const required = requiredWltpRangeKm(200, reliable, a);
    const vehicle = vehicleFixture({ maxDailyKm: 200 });
    expect(
      findRejection(vehicle, evFixture({ rangeKm: required }), reliable, a),
    ).toBeNull();
    expect(
      findRejection(vehicle, evFixture({ rangeKm: required - 1 }), reliable, a),
    ).toBe("winter_range");
  });

  it("requires more range without reliable charging", () => {
    const none = { ...reliable, hasReliableCharging: false };
    expect(requiredWltpRangeKm(100, none, a)).toBeGreaterThan(
      requiredWltpRangeKm(100, reliable, a),
    );
  });

  it("rejects by seats, body type and missing cargo data", () => {
    expect(
      findRejection(
        vehicleFixture(),
        evFixture({ brand: "FIAT", model: "500" }),
        reliable,
        a,
      ),
    ).toBe("seats");
    expect(
      findRejection(
        vehicleFixture({ bodyType: "van" }),
        evFixture(),
        reliable,
        a,
      ),
    ).toBe("body_type");
    expect(
      findRejection(
        vehicleFixture(),
        evFixture({ bodyType: "MINIBUS" }),
        reliable,
        a,
      ),
    ).toBe("body_type");
    expect(
      findRejection(
        vehicleFixture({ bodyType: "van", payloadKg: 700 }),
        evFixture({ bodyType: "COMBISPACE" }),
        reliable,
        a,
      ),
    ).toBe("cargo_data_missing");
  });

  it("assumes eight seats for a minibus", () => {
    expect(assumedSeats(evFixture({ bodyType: "MINIBUS" }))).toBe(8);
  });
});
