import { DEFAULT_ASSUMPTIONS } from "./config/assumptions.ts";
import type { Assumptions } from "./config/assumptions.ts";
import type {
  ChargingStation,
  EvModel,
  FleetVehicle,
  FuelYearPrice,
} from "./domain/schemas.ts";

export const vehicleFixture = (
  overrides: Partial<FleetVehicle> = {},
): FleetVehicle => ({
  id: "v1",
  make: "Renault",
  model: "Clio",
  year: 2021,
  bodyType: "hatchback",
  fuelType: "diesel",
  seats: 5,
  annualKm: 20_000,
  maxDailyKm: 100,
  litersPer100Km: 5,
  purchasePriceEur: 25_000,
  leaseMonthlyEur: 300,
  maintenanceEurPerYear: 1000,
  insuranceEurPerYear: 800,
  leaseEndDate: "2027-06-30",
  baseCommune: "Nice",
  baseLat: 43.7,
  baseLon: 7.26,
  hasDepotCharging: false,
  cargoVolumeM3: null,
  payloadKg: null,
  ...overrides,
});

export const evFixture = (overrides: Partial<EvModel> = {}): EvModel => ({
  id: "ev1",
  modelKey: "peugeot-208",
  brand: "PEUGEOT",
  model: "208",
  variant: "e-208",
  bodyType: "BERLINE",
  segment: "ECONOMIQUE",
  priceEur: 30_000,
  powerKw: 57,
  kwhPer100Km: 15,
  rangeKm: 350,
  massKg: 1500,
  group: "STELLANTIS",
  fiscalPower: 4,
  emptyWeightKg: 1455,
  urbanRangeKm: 450,
  ...overrides,
});

export const stationFixture = (
  overrides: Partial<ChargingStation> = {},
): ChargingStation => ({
  id: "s1",
  name: "Station",
  address: null,
  latitude: 43.701,
  longitude: 7.261,
  chargingPoints: 2,
  maxPowerKw: 150,
  ...overrides,
});

export const fuelHistoryFixture: FuelYearPrice[] = [
  { year: 2022, dieselEurPerLitre: 1.8, petrolEurPerLitre: 1.7 },
  { year: 2023, dieselEurPerLitre: 1.7, petrolEurPerLitre: 1.8 },
  { year: 2024, dieselEurPerLitre: 1.65, petrolEurPerLitre: 1.75 },
  { year: 2025, dieselEurPerLitre: 1.6, petrolEurPerLitre: 1.7 },
];

export const assumptionsFixture = (
  overrides: Partial<Assumptions> = {},
): Assumptions => ({ ...DEFAULT_ASSUMPTIONS, ...overrides });
