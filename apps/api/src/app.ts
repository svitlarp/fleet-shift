import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { ApiError } from "./lib/api-error.ts";
import { analysisPlugin } from "./plugins/analysis.ts";
import { fleetsPlugin } from "./plugins/fleets.ts";
import { referencePlugin } from "./plugins/reference.ts";
import type { FleetRepository } from "./repositories/fleet-repository.ts";
import type { ReferenceData } from "./services/reference-data.ts";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_BODY_BYTES = 30 * 1024 * 1024;

export interface AppOptions {
  repository: FleetRepository;
  reference: ReferenceData;
  webOrigin?: string;
  logger?: boolean;
}

export async function buildApp({
  repository,
  reference,
  webOrigin = "http://localhost:5173",
  logger = false,
}: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger, bodyLimit: MAX_BODY_BYTES });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: {
          code: "validation_error",
          message: "Request is invalid",
          details: error.validation.map((v) => ({
            field: v.instancePath.replace(/^\//, "").replaceAll("/", "."),
            message: v.message,
          })),
        },
      });
    }
    const statusCode =
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;
    if (statusCode < 500) {
      return reply.code(statusCode).send({
        error: { code: "bad_request", message: (error as Error).message },
      });
    }
    request.log.error(error);
    return reply.code(500).send({
      error: { code: "internal_error", message: "Unexpected server error" },
    });
  });

  await app.register(cors, {
    origin: webOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
  });
  await app.register(multipart, {
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    throwFileSizeLimit: true,
  });

  app.get("/api/health", () => ({ status: "ok" }));
  await app.register(fleetsPlugin, {
    prefix: "/api",
    repository,
    reference,
  });
  await app.register(analysisPlugin, {
    prefix: "/api",
    repository,
    reference,
  });
  await app.register(referencePlugin, { prefix: "/api", reference });
  return app;
}
