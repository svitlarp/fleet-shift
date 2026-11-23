import { analyzeFleet } from "@fleetshift/core";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { ApiError, notFound } from "../lib/api-error.ts";
import type { FleetRepository } from "../repositories/fleet-repository.ts";
import type { ReferenceData } from "../services/reference-data.ts";

const params = z.object({ fleetId: z.uuid() });

interface AnalysisOptions {
  repository: FleetRepository;
  reference: ReferenceData;
}

export const analysisPlugin: FastifyPluginCallbackZod<AnalysisOptions> = (
  app,
  { repository, reference },
  done,
) => {
  app.post(
    "/fleets/:fleetId/analyses",
    { schema: { params } },
    async (request, reply) => {
      const fleet = await repository.getFleet(request.params.fleetId);
      if (!fleet) throw notFound("Fleet");
      if (fleet.vehicles.length === 0) {
        throw new ApiError(422, "empty_fleet", "Fleet has no vehicles");
      }
      const result = analyzeFleet({
        vehicles: fleet.vehicles,
        catalog: reference.catalog,
        stations: reference.stations,
        fuelHistory: reference.fuelHistory,
        assumptions: fleet.assumptions,
      });
      const saved = await repository.saveAnalysis(fleet.id, result);
      return reply.code(201).send(saved);
    },
  );

  app.get(
    "/fleets/:fleetId/analyses/latest",
    { schema: { params } },
    async (request) => {
      const saved = await repository.getLatestAnalysis(request.params.fleetId);
      if (!saved) throw notFound("Analysis");
      return saved;
    },
  );
  done();
};
