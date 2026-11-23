import { assumptionsSchema } from "@fleetshift/core";
import type { Assumptions } from "@fleetshift/core";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useGetFleetQuery,
  useRunAnalysisMutation,
  useSaveAssumptionsMutation,
} from "../api/fleet-api.ts";
import { Loader } from "../components/loader/Loader.tsx";
import { t } from "../i18n/en.ts";
import { zodValidate } from "../lib/zod-formik.ts";

type NumericField = keyof typeof t.assumptions.fields &
  {
    [K in keyof Assumptions]: Assumptions[K] extends number ? K : never;
  }[keyof Assumptions];

const COST_FIELDS: NumericField[] = [
  "discountRate",
  "leaseAnnualRate",
  "evResidualShare",
  "iceResidualShare",
  "evMaintenanceFactor",
];
const CHARGING_FIELDS: NumericField[] = [
  "depotTariffEurPerKwh",
  "publicAcTariffEurPerKwh",
  "publicDcTariffEurPerKwh",
  "depotChargingShare",
  "publicFastShare",
  "winterRangeFactor",
  "rangeReserve",
  "realWorldConsumptionFactor",
];

function NumberField({ name }: { name: NumericField }) {
  return (
    <label className="field">
      {t.assumptions.fields[name]}
      <Field name={name} type="number" step="any" />
      <ErrorMessage name={name} component="span" className="field-error" />
    </label>
  );
}

export function AssumptionsPage() {
  const { fleetId = "" } = useParams();
  const navigate = useNavigate();
  const fleet = useGetFleetQuery(fleetId);
  const [saveAssumptions] = useSaveAssumptionsMutation();
  const [runAnalysis] = useRunAnalysisMutation();

  if (fleet.isLoading) return <Loader />;
  if (!fleet.data) return <p role="alert">{t.common.genericError}</p>;

  const handleSubmit = async (values: Assumptions) => {
    try {
      await saveAssumptions({
        fleetId,
        assumptions: assumptionsSchema.parse(values),
      }).unwrap();
      toast.success(t.assumptions.saved);
      await runAnalysis(fleetId).unwrap();
      void navigate(`/fleets/${fleetId}/results`);
    } catch (error) {
      toast.error(
        (error as Partial<ApiQueryError>).error?.message ??
          t.common.genericError,
      );
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.assumptions.title}</h1>
          <p className="muted">{t.assumptions.note}</p>
        </div>
        <Link className="btn" to={`/fleets/${fleetId}`}>
          {fleet.data.name}
        </Link>
      </div>
      <Formik<Assumptions>
        initialValues={fleet.data.assumptions}
        enableReinitialize
        validate={zodValidate<Assumptions>(assumptionsSchema)}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form noValidate>
            <section className="card">
              <h2>{t.assumptions.budgets}</h2>
              <div className="form-grid">
                <NumberField name="budget2027Eur" />
                <NumberField name="budget2028Eur" />
                <label className="field">
                  {t.assumptions.fields.riskMode}
                  <Field name="riskMode" as="select">
                    <option value="balanced">
                      {t.assumptions.options.balanced}
                    </option>
                    <option value="cautious">
                      {t.assumptions.options.cautious}
                    </option>
                  </Field>
                </label>
                <label className="field">
                  {t.assumptions.fields.financingMode}
                  <Field name="financingMode" as="select">
                    <option value="lease">{t.assumptions.options.lease}</option>
                    <option value="purchase">
                      {t.assumptions.options.purchase}
                    </option>
                  </Field>
                </label>
              </div>
            </section>
            <section className="card">
              <h2>{t.assumptions.costs}</h2>
              <div className="form-grid">
                {COST_FIELDS.map((name) => (
                  <NumberField key={name} name={name} />
                ))}
              </div>
            </section>
            <section className="card">
              <h2>{t.assumptions.charging}</h2>
              <div className="form-grid">
                {CHARGING_FIELDS.map((name) => (
                  <NumberField key={name} name={name} />
                ))}
              </div>
            </section>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {t.assumptions.runAnalysis}
            </button>
          </Form>
        )}
      </Formik>
    </>
  );
}
