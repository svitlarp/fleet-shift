import {
  bodyTypeSchema,
  fleetVehicleSchema,
  fuelTypeSchema,
} from "@fleetshift/core";
import type { FleetVehicle } from "@fleetshift/core";
import { Form, Formik } from "formik";
import {
  Building2,
  Calendar,
  CalendarClock,
  CarFront,
  Euro,
  Fuel,
  Gauge,
  Hash,
  MapPin,
  Navigation,
  PlugZap,
  Route,
  Save,
  ShieldCheck,
  Tag,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { t } from "../../i18n/en.ts";
import { zodValidate } from "../../lib/zod-formik.ts";
import { Button } from "../ui/Button.tsx";
import { Card } from "../ui/Card.tsx";
import { FormField, FormGrid, SwitchField } from "../ui/FormField.tsx";
import { FormSelect } from "../ui/FormSelect.tsx";

const EMPTY_VEHICLE = {
  id: "",
  make: "",
  model: "",
  year: 2022,
  bodyType: "hatchback",
  fuelType: "diesel",
  seats: 5,
  annualKm: 20000,
  maxDailyKm: 100,
  litersPer100Km: 6,
  purchasePriceEur: 25000,
  leaseMonthlyEur: 350,
  maintenanceEurPerYear: 900,
  insuranceEurPerYear: 800,
  leaseEndDate: "2027-12-31",
  baseCommune: "",
  baseLat: 43.7,
  baseLon: 7.26,
  hasDepotCharging: false,
  cargoVolumeM3: null,
  payloadKg: null,
} satisfies FleetVehicle;

const TEXT_FIELDS: {
  name: "id" | "make" | "model" | "baseCommune";
  icon: LucideIcon;
}[] = [
  { name: "id", icon: Hash },
  { name: "make", icon: Building2 },
  { name: "model", icon: Tag },
  { name: "baseCommune", icon: MapPin },
];

const NUMBER_FIELDS: {
  name: Exclude<
    keyof typeof t.vehicleFields,
    | "id"
    | "make"
    | "model"
    | "baseCommune"
    | "bodyType"
    | "fuelType"
    | "leaseEndDate"
    | "hasDepotCharging"
  >;
  icon: LucideIcon;
}[] = [
  { name: "year", icon: Calendar },
  { name: "seats", icon: Users },
  { name: "annualKm", icon: Route },
  { name: "maxDailyKm", icon: Gauge },
  { name: "litersPer100Km", icon: Fuel },
  { name: "purchasePriceEur", icon: Euro },
  { name: "leaseMonthlyEur", icon: Wallet },
  { name: "maintenanceEurPerYear", icon: Wrench },
  { name: "insuranceEurPerYear", icon: ShieldCheck },
  { name: "baseLat", icon: Navigation },
  { name: "baseLon", icon: Navigation },
];

const toOptions = (values: readonly string[]) =>
  values.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));

interface VehicleFormProps {
  vehicle: FleetVehicle | null;
  isSaving: boolean;
  onSubmit: (vehicle: FleetVehicle) => Promise<void>;
  onCancel: () => void;
}

export function VehicleForm({
  vehicle,
  isSaving,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  return (
    <Formik<FleetVehicle>
      initialValues={vehicle ?? EMPTY_VEHICLE}
      enableReinitialize
      validate={zodValidate<FleetVehicle>(fleetVehicleSchema)}
      onSubmit={(values) => onSubmit(fleetVehicleSchema.parse(values))}
    >
      <Form noValidate>
        <Card>
          <FormGrid>
            {TEXT_FIELDS.map(({ name, icon }) => (
              <FormField
                key={name}
                name={name}
                label={t.vehicleFields[name]}
                icon={icon}
              />
            ))}
            <FormSelect
              name="bodyType"
              label={t.vehicleFields.bodyType}
              icon={CarFront}
              options={toOptions(bodyTypeSchema.options)}
            />
            <FormSelect
              name="fuelType"
              label={t.vehicleFields.fuelType}
              icon={Fuel}
              options={toOptions(fuelTypeSchema.options)}
            />
            {NUMBER_FIELDS.map(({ name, icon }) => (
              <FormField
                key={name}
                name={name}
                type="number"
                label={t.vehicleFields[name]}
                icon={icon}
              />
            ))}
            <FormField
              name="leaseEndDate"
              type="date"
              label={t.vehicleFields.leaseEndDate}
              icon={CalendarClock}
            />
            <SwitchField
              name="hasDepotCharging"
              label={t.vehicleFields.hasDepotCharging}
              icon={PlugZap}
            />
          </FormGrid>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              marginTop: "var(--space-4)",
            }}
          >
            <Button
              variant="primary"
              type="submit"
              icon={Save}
              disabled={isSaving}
            >
              {t.common.save}
            </Button>
            <Button icon={X} onClick={onCancel}>
              {t.common.cancel}
            </Button>
          </div>
        </Card>
      </Form>
    </Formik>
  );
}
