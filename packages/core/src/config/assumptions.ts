import { z } from "zod";

export const HORIZON_YEARS = 5;
export const PLAN_YEARS = [2027, 2028] as const;
export const MIN_FLEET_SIZE = 5;
export const MAX_FLEET_SIZE = 30;

export const assumptionsSchema = z
  .object({
    financingMode: z.enum(["lease", "purchase"]).default("lease"),
    riskMode: z.enum(["cautious", "balanced"]).default("balanced"),
    budget2027Eur: z.number().min(0).default(60_000),
    budget2028Eur: z.number().min(0).default(60_000),
    discountRate: z.number().min(0).max(0.3).default(0.04),
    winterRangeFactor: z.number().gt(0).max(1).default(0.7),
    rangeReserve: z.number().min(0).max(1).default(0.1),
    rangeReserveNoCharging: z.number().min(0).max(1).default(0.25),
    fastChargerMinKw: z.number().positive().default(50),
    chargingRadiusKm: z.number().positive().default(10),
    evLeaseMonths: z.number().int().positive().default(60),
    leaseAnnualRate: z.number().min(0).max(0.3).default(0.05),
    evResidualShare: z.number().min(0).max(1).default(0.35),
    iceResidualShare: z.number().min(0).max(1).default(0.4),
    realWorldConsumptionFactor: z.number().min(1).max(2).default(1.15),
    depotTariffEurPerKwh: z.number().min(0).default(0.2),
    publicAcTariffEurPerKwh: z.number().min(0).default(0.4),
    publicDcTariffEurPerKwh: z.number().min(0).default(0.55),
    depotChargingShare: z.number().min(0).max(1).default(0.8),
    publicFastShare: z.number().min(0).max(1).default(0.3),
    evMaintenanceFactor: z.number().min(0).max(2).default(0.7),
    evInsuranceFactor: z.number().min(0).max(3).default(1),
    electricityVolatility: z.number().min(0).max(1).default(0.1),
    mileageVolatility: z.number().min(0).max(1).default(0.1),
    residualVolatility: z.number().min(0).max(1).default(0.15),
    minPaybackShare: z.number().min(0).max(1).default(0.6),
    scenarioCount: z.number().int().min(1).max(10_000).default(1000),
    seed: z.number().int().default(20261123),
  })
  .strict();

export type Assumptions = z.infer<typeof assumptionsSchema>;
export type AssumptionsInput = z.input<typeof assumptionsSchema>;

export const DEFAULT_ASSUMPTIONS: Assumptions = assumptionsSchema.parse({});
