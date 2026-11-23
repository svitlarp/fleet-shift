import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { loadEnv } from "../config/env.ts";
import { createDb } from "./client.ts";

const { db, pool } = createDb(loadEnv().DATABASE_URL);
try {
  await migrate(db, {
    migrationsFolder: path.join(import.meta.dirname, "../../drizzle"),
  });
} finally {
  await pool.end();
}
