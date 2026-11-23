import type {
  Assumptions,
  FleetAnalysis,
  FleetVehicle,
} from "@fleetshift/core";
import { DEFAULT_ASSUMPTIONS } from "@fleetshift/core";
import { and, asc, count, desc, eq, max, sql } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { analyses, fleetAssumptions, fleets, vehicles } from "../db/schema.ts";
import type {
  FleetDetail,
  FleetListItem,
  FleetRepository,
  SavedAnalysis,
} from "./fleet-repository.ts";

export class DrizzleFleetRepository implements FleetRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async listFleets(): Promise<FleetListItem[]> {
    const rows = await this.db
      .select({
        id: fleets.id,
        name: fleets.name,
        createdAt: fleets.createdAt,
        vehicleCount: count(vehicles.vehicleId),
      })
      .from(fleets)
      .leftJoin(vehicles, eq(vehicles.fleetId, fleets.id))
      .groupBy(fleets.id)
      .orderBy(desc(fleets.createdAt));
    const latest = await this.db
      .selectDistinctOn([analyses.fleetId], {
        fleetId: analyses.fleetId,
        createdAt: analyses.createdAt,
        replaceCount: sql<number>`(
          select count(*)::int
          from jsonb_array_elements(${analyses.result}->'plan'->'entries') as entry
          where entry->>'decision' = 'replace'
        )`,
        medianSavingsEur: sql<number>`(${analyses.result}->'plan'->>'totalMedianSavingsEur')::float8`,
      })
      .from(analyses)
      .orderBy(analyses.fleetId, desc(analyses.createdAt));
    const latestByFleet = new Map(latest.map((a) => [a.fleetId, a]));
    return rows.map((r) => {
      const analysis = latestByFleet.get(r.id);
      return {
        ...r,
        createdAt: r.createdAt.toISOString(),
        latestAnalysis: analysis
          ? {
              createdAt: analysis.createdAt.toISOString(),
              replaceCount: analysis.replaceCount,
              medianSavingsEur: analysis.medianSavingsEur,
            }
          : null,
      };
    });
  }

  async createFleet(
    name: string,
    fleetVehicles: FleetVehicle[],
    assumptions: Assumptions,
  ): Promise<FleetDetail> {
    const id = await this.db.transaction(async (tx) => {
      const [fleet] = await tx
        .insert(fleets)
        .values({ name })
        .returning({ id: fleets.id });
      if (!fleet) throw new Error("Fleet insert returned no row");
      if (fleetVehicles.length > 0) {
        await tx.insert(vehicles).values(
          fleetVehicles.map((data, position) => ({
            fleetId: fleet.id,
            vehicleId: data.id,
            position,
            data,
          })),
        );
      }
      await tx
        .insert(fleetAssumptions)
        .values({ fleetId: fleet.id, data: assumptions });
      return fleet.id;
    });
    const created = await this.getFleet(id);
    if (!created) throw new Error("Created fleet could not be read");
    return created;
  }

  async getFleet(id: string): Promise<FleetDetail | null> {
    const [fleet] = await this.db
      .select()
      .from(fleets)
      .where(eq(fleets.id, id));
    if (!fleet) return null;
    const rows = await this.db
      .select({ data: vehicles.data })
      .from(vehicles)
      .where(eq(vehicles.fleetId, id))
      .orderBy(asc(vehicles.position));
    const [saved] = await this.db
      .select({ data: fleetAssumptions.data })
      .from(fleetAssumptions)
      .where(eq(fleetAssumptions.fleetId, id));
    return {
      id: fleet.id,
      name: fleet.name,
      createdAt: fleet.createdAt.toISOString(),
      vehicleCount: rows.length,
      vehicles: rows.map((r) => r.data),
      assumptions: saved?.data ?? DEFAULT_ASSUMPTIONS,
    };
  }

  async deleteFleet(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(fleets)
      .where(eq(fleets.id, id))
      .returning({ id: fleets.id });
    return rows.length > 0;
  }

  async addVehicle(fleetId: string, vehicle: FleetVehicle): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [fleet] = await tx
        .select({ id: fleets.id })
        .from(fleets)
        .where(eq(fleets.id, fleetId))
        .for("update");
      if (!fleet) return false;
      const [last] = await tx
        .select({ position: max(vehicles.position) })
        .from(vehicles)
        .where(eq(vehicles.fleetId, fleetId));
      await tx.insert(vehicles).values({
        fleetId,
        vehicleId: vehicle.id,
        position: (last?.position ?? -1) + 1,
        data: vehicle,
      });
      return true;
    });
  }

  async updateVehicle(
    fleetId: string,
    vehicleId: string,
    vehicle: FleetVehicle,
  ): Promise<boolean> {
    const rows = await this.db
      .update(vehicles)
      .set({ vehicleId: vehicle.id, data: vehicle })
      .where(
        and(eq(vehicles.fleetId, fleetId), eq(vehicles.vehicleId, vehicleId)),
      )
      .returning({ id: vehicles.vehicleId });
    return rows.length > 0;
  }

  async deleteVehicle(fleetId: string, vehicleId: string): Promise<boolean> {
    const rows = await this.db
      .delete(vehicles)
      .where(
        and(eq(vehicles.fleetId, fleetId), eq(vehicles.vehicleId, vehicleId)),
      )
      .returning({ id: vehicles.vehicleId });
    return rows.length > 0;
  }

  async saveAssumptions(
    fleetId: string,
    assumptions: Assumptions,
  ): Promise<boolean> {
    const [fleet] = await this.db
      .select({ id: fleets.id })
      .from(fleets)
      .where(eq(fleets.id, fleetId));
    if (!fleet) return false;
    await this.db
      .insert(fleetAssumptions)
      .values({ fleetId, data: assumptions })
      .onConflictDoUpdate({
        target: fleetAssumptions.fleetId,
        set: { data: assumptions, updatedAt: new Date() },
      });
    return true;
  }

  async saveAnalysis(
    fleetId: string,
    result: FleetAnalysis,
  ): Promise<SavedAnalysis> {
    const [row] = await this.db
      .insert(analyses)
      .values({ fleetId, result })
      .returning();
    if (!row) throw new Error("Analysis insert returned no row");
    return { ...row, createdAt: row.createdAt.toISOString() };
  }

  async getLatestAnalysis(fleetId: string): Promise<SavedAnalysis | null> {
    const [row] = await this.db
      .select()
      .from(analyses)
      .where(eq(analyses.fleetId, fleetId))
      .orderBy(desc(analyses.createdAt))
      .limit(1);
    return row ? { ...row, createdAt: row.createdAt.toISOString() } : null;
  }
}
