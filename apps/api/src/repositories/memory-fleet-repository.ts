import { randomUUID } from "node:crypto";
import type {
  Assumptions,
  FleetAnalysis,
  FleetVehicle,
} from "@fleetshift/core";
import type {
  FleetDetail,
  FleetRepository,
  FleetSummary,
  SavedAnalysis,
} from "./fleet-repository.ts";

/** In-process store used by offline route tests. */
export class MemoryFleetRepository implements FleetRepository {
  private readonly fleets = new Map<string, FleetDetail>();
  private readonly analyses = new Map<string, SavedAnalysis>();

  listFleets(): Promise<FleetSummary[]> {
    return Promise.resolve(
      [...this.fleets.values()].map(
        ({ id, name, createdAt, vehicles }): FleetSummary => ({
          id,
          name,
          createdAt,
          vehicleCount: vehicles.length,
        }),
      ),
    );
  }

  createFleet(
    name: string,
    vehicles: FleetVehicle[],
    assumptions: Assumptions,
  ): Promise<FleetDetail> {
    const fleet: FleetDetail = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      vehicleCount: vehicles.length,
      vehicles: [...vehicles],
      assumptions,
    };
    this.fleets.set(fleet.id, fleet);
    return Promise.resolve(fleet);
  }

  getFleet(id: string): Promise<FleetDetail | null> {
    return Promise.resolve(this.fleets.get(id) ?? null);
  }

  deleteFleet(id: string): Promise<boolean> {
    this.analyses.delete(id);
    return Promise.resolve(this.fleets.delete(id));
  }

  addVehicle(fleetId: string, vehicle: FleetVehicle): Promise<boolean> {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return Promise.resolve(false);
    fleet.vehicles.push(vehicle);
    fleet.vehicleCount = fleet.vehicles.length;
    return Promise.resolve(true);
  }

  updateVehicle(
    fleetId: string,
    vehicleId: string,
    vehicle: FleetVehicle,
  ): Promise<boolean> {
    const fleet = this.fleets.get(fleetId);
    const index = fleet?.vehicles.findIndex((v) => v.id === vehicleId) ?? -1;
    if (!fleet || index < 0) return Promise.resolve(false);
    fleet.vehicles[index] = vehicle;
    return Promise.resolve(true);
  }

  deleteVehicle(fleetId: string, vehicleId: string): Promise<boolean> {
    const fleet = this.fleets.get(fleetId);
    if (!fleet?.vehicles.some((v) => v.id === vehicleId)) {
      return Promise.resolve(false);
    }
    fleet.vehicles = fleet.vehicles.filter((v) => v.id !== vehicleId);
    fleet.vehicleCount = fleet.vehicles.length;
    return Promise.resolve(true);
  }

  saveAssumptions(fleetId: string, assumptions: Assumptions): Promise<boolean> {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return Promise.resolve(false);
    fleet.assumptions = assumptions;
    return Promise.resolve(true);
  }

  saveAnalysis(fleetId: string, result: FleetAnalysis): Promise<SavedAnalysis> {
    const saved: SavedAnalysis = {
      id: randomUUID(),
      fleetId,
      createdAt: new Date().toISOString(),
      result,
    };
    this.analyses.set(fleetId, saved);
    return Promise.resolve(saved);
  }

  getLatestAnalysis(fleetId: string): Promise<SavedAnalysis | null> {
    return Promise.resolve(this.analyses.get(fleetId) ?? null);
  }
}
