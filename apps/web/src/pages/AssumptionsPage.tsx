import { assumptionsSchema } from "@fleetshift/core";
import type { Assumptions } from "@fleetshift/core";
import { Form, Formik } from "formik";
import {
  ArrowLeft,
  BatteryCharging,
  CalendarDays,
  CarFront,
  Euro,
  Factory,
  Gauge,
  Landmark,
  Leaf,
  Percent,
  Play,
  PlugZap,
  Scale,
  ShieldAlert,
  Snowflake,
  TrendingDown,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useGetFleetQuery,
  useRunAnalysisMutation,
  useSaveAssumptionsMutation,
} from "../api/fleet-api.ts";
import { Loader } from "../components/loader/Loader.tsx";
import { Button, ButtonLink } from "../components/ui/Button.tsx";
import { Card } from "../components/ui/Card.tsx";
import { FormField, FormGrid } from "../components/ui/FormField.tsx";
import { FormSelect } from "../components/ui/FormSelect.tsx";
import { t } from "../i18n/en.ts";
import { zodValidate } from "../lib/zod-formik.ts";
import css from "./Page.module.css";

type NumericField = keyof typeof t.assumptions.fields &
  {
    [K in keyof Assumptions]: Assumptions[K] extends number ? K : never;
  }[keyof Assumptions];

/** Steps and limits for the number inputs; limits match the shared assumptions schema. */
const NUMBER_INPUTS: Record<
  NumericField,
  { step: number; min: number; max?: number }
> = {
  budget2027Eur: { step: 1000, min: 0 },
  budget2028Eur: { step: 1000, min: 0 },
  discountRate: { step: 0.01, min: 0, max: 0.3 },
  leaseAnnualRate: { step: 0.005, min: 0, max: 0.3 },
  evResidualShare: { step: 0.05, min: 0, max: 1 },
  iceResidualShare: { step: 0.05, min: 0, max: 1 },
  evMaintenanceFactor: { step: 0.1, min: 0, max: 2 },
  depotTariffEurPerKwh: { step: 0.01, min: 0 },
  publicAcTariffEurPerKwh: { step: 0.01, min: 0 },
  publicDcTariffEurPerKwh: { step: 0.01, min: 0 },
  depotChargingShare: { step: 0.05, min: 0, max: 1 },
  publicFastShare: { step: 0.05, min: 0, max: 1 },
  winterRangeFactor: { step: 0.05, min: 0.05, max: 1 },
  rangeReserve: { step: 0.05, min: 0, max: 1 },
  realWorldConsumptionFactor: { step: 0.05, min: 1, max: 2 },
};

const COST_FIELDS: { name: NumericField; icon: LucideIcon }[] = [
  { name: "discountRate", icon: Percent },
  { name: "leaseAnnualRate", icon: Landmark },
  { name: "evResidualShare", icon: TrendingDown },
  { name: "iceResidualShare", icon: Factory },
  { name: "evMaintenanceFactor", icon: Wrench },
];

const CHARGING_FIELDS: { name: NumericField; icon: LucideIcon }[] = [
  { name: "depotTariffEurPerKwh", icon: PlugZap },
  { name: "publicAcTariffEurPerKwh", icon: BatteryCharging },
  { name: "publicDcTariffEurPerKwh", icon: Zap },
  { name: "depotChargingShare", icon: Percent },
  { name: "publicFastShare", icon: Gauge },
  { name: "winterRangeFactor", icon: Snowflake },
  { name: "rangeReserve", icon: ShieldAlert },
  { name: "realWorldConsumptionFactor", icon: Leaf },
];

const RISK_OPTIONS = [
  { value: "cautious", label: t.assumptions.options.cautious },
  { value: "balanced", label: t.assumptions.options.balanced },
  { value: "risky", label: t.assumptions.options.risky },
];

const FINANCING_OPTIONS = [
  { value: "lease", label: t.assumptions.options.lease },
  { value: "purchase", label: t.assumptions.options.purchase },
];

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

  const renderField = ({
    name,
    icon,
  }: {
    name: NumericField;
    icon: LucideIcon;
  }) => (
    <FormField
      key={name}
      name={name}
      type="number"
      label={t.assumptions.fields[name]}
      icon={icon}
      hint={t.assumptions.hints[name]}
      {...NUMBER_INPUTS[name]}
    />
  );

  return (
    <>
      <div className={css.head}>
        <div>
          <h1>{t.assumptions.title}</h1>
          <p className={css.muted}>{t.assumptions.note}</p>
        </div>
        <ButtonLink icon={ArrowLeft} to={`/fleets/${fleetId}`}>
          {fleet.data.name}
        </ButtonLink>
      </div>
      <Formik<Assumptions>
        initialValues={fleet.data.assumptions}
        enableReinitialize
        validate={zodValidate<Assumptions>(assumptionsSchema)}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form noValidate>
            <Card>
              <h2 className={css.sectionTitle}>
                <CalendarDays size={18} aria-hidden="true" />
                {t.assumptions.budgets}
              </h2>
              <FormGrid>
                {renderField({ name: "budget2027Eur", icon: Euro })}
                {renderField({ name: "budget2028Eur", icon: Euro })}
                <FormSelect
                  name="riskMode"
                  label={t.assumptions.fields.riskMode}
                  icon={Scale}
                  hint={t.assumptions.hints.riskMode}
                  options={RISK_OPTIONS}
                />
                <FormSelect
                  name="financingMode"
                  label={t.assumptions.fields.financingMode}
                  icon={Wallet}
                  hint={t.assumptions.hints.financingMode}
                  options={FINANCING_OPTIONS}
                />
              </FormGrid>
            </Card>
            <Card>
              <h2 className={css.sectionTitle}>
                <CarFront size={18} aria-hidden="true" />
                {t.assumptions.costs}
              </h2>
              <FormGrid>{COST_FIELDS.map(renderField)}</FormGrid>
            </Card>
            <Card>
              <h2 className={css.sectionTitle}>
                <PlugZap size={18} aria-hidden="true" />
                {t.assumptions.charging}
              </h2>
              <FormGrid>{CHARGING_FIELDS.map(renderField)}</FormGrid>
            </Card>
            <Button
              variant="primary"
              type="submit"
              icon={Play}
              disabled={isSubmitting}
            >
              {t.assumptions.runAnalysis}
            </Button>
          </Form>
        )}
      </Formik>
    </>
  );
}
