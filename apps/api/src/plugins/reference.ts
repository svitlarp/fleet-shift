import { stationsWithinRadius } from "@fleetshift/core";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
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
    "/stations",
    { schema: { querystring: stationsQuery } },
    (request) => {
      const { lat, lon, radiusKm } = request.query;
      return stationsWithinRadius(lat, lon, reference.stations, radiusKm);
    },
  );
  done();
};
