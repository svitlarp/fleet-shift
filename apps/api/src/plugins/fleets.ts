import {
  assumptionsSchema,
  defaultAssumptionsForFleet,
  fleetVehicleSchema,
  normalizeFleetRow,
  validateFleet,
} from "@fleetshift/core";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { ApiError, notFound } from "../lib/api-error.ts";
import type { FleetRepository } from "../repositories/fleet-repository.ts";
import type { ReferenceData } from "../services/reference-data.ts";
import {
  FLEET_CSV_COLUMNS,
  parseFleetFile,
} from "../services/parse-fleet-file.ts";

const fleetParams = z.object({ fleetId: z.uuid() });
const vehicleParams = fleetParams.extend({ vehicleId: z.string().min(1) });
const fleetName = z.string().trim().min(1).max(120);

interface FleetsOptions {
  repository: FleetRepository;
  reference: ReferenceData;
}

export const fleetsPlugin: FastifyPluginCallbackZod<FleetsOptions> = (
  app,
  { repository, reference },
  done,
) => {
  const createValidated = async (name: string, rows: unknown[]) => {
    const { vehicles, errors, warnings } = validateFleet(rows);
    if (errors.length > 0) {
      throw new ApiError(422, "invalid_fleet", "Fleet has invalid rows", {
        errors,
        warnings,
      });
    }
    const fleet = await repository.createFleet(
      name,
      vehicles,
      defaultAssumptionsForFleet(vehicles),
    );
    return { fleet, warnings };
  };

  const requireFleet = async (id: string) => {
    const fleet = await repository.getFleet(id);
    if (!fleet) throw notFound("Fleet");
    return fleet;
  };

  app.get("/fleets", () => repository.listFleets());

  app.get("/fleets/template.csv", (_request, reply) =>
    reply
      .header("content-type", "text/csv; charset=utf-8")
      .header(
        "content-disposition",
        'attachment; filename="fleet-template.csv"',
      )
      .send(`${FLEET_CSV_COLUMNS.join(",")}\n`),
  );

  app.post(
    "/fleets",
    {
      schema: {
        body: z.object({ name: fleetName, vehicles: z.array(z.unknown()) }),
      },
    },
    async (request, reply) => {
      const { name, vehicles } = request.body;
      const created = await createValidated(
        name,
        vehicles.map(normalizeFleetRow),
      );
      return reply.code(201).send(created);
    },
  );

  app.post("/fleets/demo", async (_request, reply) => {
    const created = await createValidated(
      "Demo: estate agency (synthetic)",
      reference.demoFleetRows.map(normalizeFleetRow),
    );
    return reply.code(201).send(created);
  });

  app.post("/fleets/import", async (request, reply) => {
    const file = await request.file();
    if (!file) throw new ApiError(400, "invalid_file", "No file uploaded");
    const content = (await file.toBuffer()).toString("utf-8");
    const rows = parseFleetFile(file.filename, content);
    const name = file.filename.replace(/\.[^.]+$/, "") || "Imported fleet";
    return reply.code(201).send(await createValidated(name, rows));
  });

  app.get("/fleets/:fleetId", { schema: { params: fleetParams } }, (request) =>
    requireFleet(request.params.fleetId),
  );

  app.delete(
    "/fleets/:fleetId",
    { schema: { params: fleetParams } },
    async (request, reply) => {
      if (!(await repository.deleteFleet(request.params.fleetId))) {
        throw notFound("Fleet");
      }
      return reply.code(204).send();
    },
  );

  app.post(
    "/fleets/:fleetId/vehicles",
    { schema: { params: fleetParams, body: fleetVehicleSchema } },
    async (request, reply) => {
      const fleet = await requireFleet(request.params.fleetId);
      if (fleet.vehicles.some((v) => v.id === request.body.id)) {
        throw new ApiError(409, "duplicate_vehicle", "Vehicle id already used");
      }
      await repository.addVehicle(fleet.id, request.body);
      return reply.code(201).send(request.body);
    },
  );

  app.put(
    "/fleets/:fleetId/vehicles/:vehicleId",
    { schema: { params: vehicleParams, body: fleetVehicleSchema } },
    async (request) => {
      const { fleetId, vehicleId } = request.params;
      const fleet = await requireFleet(fleetId);
      if (
        request.body.id !== vehicleId &&
        fleet.vehicles.some((v) => v.id === request.body.id)
      ) {
        throw new ApiError(409, "duplicate_vehicle", "Vehicle id already used");
      }
      const updated = await repository.updateVehicle(
        fleetId,
        vehicleId,
        request.body,
      );
      if (!updated) throw notFound("Vehicle");
      return request.body;
    },
  );

  app.delete(
    "/fleets/:fleetId/vehicles/:vehicleId",
    { schema: { params: vehicleParams } },
    async (request, reply) => {
      const { fleetId, vehicleId } = request.params;
      if (!(await repository.deleteVehicle(fleetId, vehicleId))) {
        throw notFound("Vehicle");
      }
      return reply.code(204).send();
    },
  );

  app.put(
    "/fleets/:fleetId/assumptions",
    { schema: { params: fleetParams, body: assumptionsSchema } },
    async (request) => {
      const saved = await repository.saveAssumptions(
        request.params.fleetId,
        request.body,
      );
      if (!saved) throw notFound("Fleet");
      return request.body;
    },
  );
  done();
};
