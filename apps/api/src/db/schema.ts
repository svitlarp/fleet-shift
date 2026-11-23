import type {
  Assumptions,
  FleetAnalysis,
  FleetVehicle,
} from "@fleetshift/core";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const fleets = pgTable("fleets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const vehicles = pgTable(
  "vehicles",
  {
    fleetId: uuid("fleet_id")
      .notNull()
      .references(() => fleets.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id").notNull(),
    position: integer("position").notNull(),
    data: jsonb("data").$type<FleetVehicle>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.fleetId, t.vehicleId] })],
);

export const fleetAssumptions = pgTable("assumptions", {
  fleetId: uuid("fleet_id")
    .primaryKey()
    .references(() => fleets.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Assumptions>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fleetId: uuid("fleet_id")
      .notNull()
      .references(() => fleets.id, { onDelete: "cascade" }),
    result: jsonb("result").$type<FleetAnalysis>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("analyses_fleet_created_idx").on(t.fleetId, t.createdAt)],
);
