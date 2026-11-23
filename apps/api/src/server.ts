import { buildApp } from "./app.ts";
import { loadEnv } from "./config/env.ts";
import { createDb } from "./db/client.ts";
import { DrizzleFleetRepository } from "./repositories/drizzle-fleet-repository.ts";
import { loadReferenceData } from "./services/reference-data.ts";

const env = loadEnv();
const { db, pool } = createDb(env.DATABASE_URL);
const app = await buildApp({
  repository: new DrizzleFleetRepository(db),
  reference: loadReferenceData(),
  webOrigin: env.WEB_ORIGIN,
  logger: true,
});
app.addHook("onClose", async () => {
  await pool.end();
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close();
  });
}

try {
  await app.listen({ port: env.API_PORT, host: "127.0.0.1" });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await app.close();
}
