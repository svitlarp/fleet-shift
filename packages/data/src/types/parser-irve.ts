// --------------  IRVE ---------------//
export interface ParseIRVEResult {
  evStations: EVStation[];
  totalevStationsPACA: number;
}

export interface EVStation {
  id: string;
  name: string | null;
  address: string | null;
  longitude: number | null;
  latitude: number | null;
  openingHours: string | null;
  access: string | null;
  commissionedDate: string | null;
  chargingPoints: number;
  declaredChargingPoints: number | null;
}
