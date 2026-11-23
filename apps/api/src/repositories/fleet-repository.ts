import type {
  Assumptions,
  FleetAnalysis,
  FleetVehicle,
} from "@fleetshift/core";

export interface FleetSummary {
  id: string;
  name: string;
  createdAt: string;
  vehicleCount: number;
}

export interface LatestAnalysisSummary {
  createdAt: string;
  replaceCount: number;
  medianSavingsEur: number;
}

export interface FleetListItem extends FleetSummary {
  latestAnalysis: LatestAnalysisSummary | null;
}

export interface FleetDetail extends FleetSummary {
  vehicles: FleetVehicle[];
  assumptions: Assumptions;
}

export interface SavedAnalysis {
  id: string;
  fleetId: string;
  createdAt: string;
  result: FleetAnalysis;
}

/** Update and delete methods return false when the target does not exist. */
export interface FleetRepository {
  listFleets(): Promise<FleetListItem[]>;
  createFleet(
    name: string,
    vehicles: FleetVehicle[],
    assumptions: Assumptions,
  ): Promise<FleetDetail>;
  getFleet(id: string): Promise<FleetDetail | null>;
  deleteFleet(id: string): Promise<boolean>;
  addVehicle(fleetId: string, vehicle: FleetVehicle): Promise<boolean>;
  updateVehicle(
    fleetId: string,
    vehicleId: string,
    vehicle: FleetVehicle,
  ): Promise<boolean>;
  deleteVehicle(fleetId: string, vehicleId: string): Promise<boolean>;
  saveAssumptions(fleetId: string, assumptions: Assumptions): Promise<boolean>;
  saveAnalysis(fleetId: string, result: FleetAnalysis): Promise<SavedAnalysis>;
  getLatestAnalysis(fleetId: string): Promise<SavedAnalysis | null>;
}
