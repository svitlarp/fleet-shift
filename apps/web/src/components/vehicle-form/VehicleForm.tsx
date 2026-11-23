import {
  bodyTypeSchema,
  fleetVehicleSchema,
  fuelTypeSchema,
} from "@fleetshift/core";
import type { FleetVehicle } from "@fleetshift/core";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { t } from "../../i18n/en.ts";
import { zodValidate } from "../../lib/zod-formik.ts";

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

const TEXT_FIELDS = ["id", "make", "model", "baseCommune"] as const;
const NUMBER_FIELDS = [
  "year",
  "seats",
  "annualKm",
  "maxDailyKm",
  "litersPer100Km",
  "purchasePriceEur",
  "leaseMonthlyEur",
  "maintenanceEurPerYear",
  "insuranceEurPerYear",
  "baseLat",
  "baseLon",
] as const;

interface VehicleFormProps {
  vehicle: FleetVehicle | null;
  isSaving: boolean;
  onSubmit: (vehicle: FleetVehicle) => Promise<void>;
  onCancel: () => void;
}

function FieldError({ name }: { name: string }) {
  return <ErrorMessage name={name} component="span" className="field-error" />;
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
      <Form className="card" noValidate>
        <div className="form-grid">
          {TEXT_FIELDS.map((name) => (
            <label className="field" key={name}>
              {t.vehicleFields[name]}
              <Field name={name} type="text" />
              <FieldError name={name} />
            </label>
          ))}
          <label className="field">
            {t.vehicleFields.bodyType}
            <Field name="bodyType" as="select">
              {bodyTypeSchema.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Field>
          </label>
          <label className="field">
            {t.vehicleFields.fuelType}
            <Field name="fuelType" as="select">
              {fuelTypeSchema.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Field>
          </label>
          {NUMBER_FIELDS.map((name) => (
            <label className="field" key={name}>
              {t.vehicleFields[name]}
              <Field name={name} type="number" step="any" />
              <FieldError name={name} />
            </label>
          ))}
          <label className="field">
            {t.vehicleFields.leaseEndDate}
            <Field name="leaseEndDate" type="date" />
            <FieldError name="leaseEndDate" />
          </label>
          <label className="field field-check">
            <Field name="hasDepotCharging" type="checkbox" />
            {t.vehicleFields.hasDepotCharging}
          </label>
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {t.common.save}
          </button>
          <button className="btn" type="button" onClick={onCancel}>
            {t.common.cancel}
          </button>
        </div>
      </Form>
    </Formik>
  );
}
