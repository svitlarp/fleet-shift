import {
  assumedSeats,
  batteryKwhFromVariant,
  stationsWithinRadius,
} from "@fleetshift/core";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { notFound } from "../lib/api-error.ts";
import type { ReferenceData } from "../services/reference-data.ts";

const stationsQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(100).default(10),
});

export const referencePlugin: FastifyPluginCallbackZod<{
  reference: ReferenceData;
}> = (app, { reference }, done) => {
  app.get("/catalog", () => ({
    source: reference.catalogSource,
    vehicles: reference.catalog,
  }));

  app.get(
    "/catalog/:evId",
    { schema: { params: z.object({ evId: z.string().min(1) }) } },
    (request) => {
      const ev = reference.catalog.find((v) => v.id === request.params.evId);
      if (!ev) throw notFound("EV");
      return {
        ev,
        photo: reference.modelDetails[ev.modelKey]?.photo ?? null,
        seatsAssumed: assumedSeats(ev),
        batteryKwh: batteryKwhFromVariant(ev.variant),
        source: reference.catalogSource,
      };
    },
  );

  app.get(
    "/stations",
    { schema: { querystring: stationsQuery } },
    (request) => {
      const { lat, lon, radiusKm } = request.query;
      return stationsWithinRadius(lat, lon, reference.stations, radiusKm);
    },
  );
  done();
};
