import type { FleetAnalysis } from "@fleetshift/core";
import {
  CalendarDays,
  CircleAlert,
  Info,
  ListChecks,
  PiggyBank,
  Play,
  RefreshCw,
  SlidersHorizontal,
  TableProperties,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useGetFleetQuery,
  useGetLatestAnalysisQuery,
  useRunAnalysisMutation,
} from "../api/fleet-api.ts";
import { ActionSummary } from "../components/action-summary/ActionSummary.tsx";
import { DecisionsTable } from "../components/decisions-table/DecisionsTable.tsx";
import { EvModal } from "../components/ev-modal/EvModal.tsx";
import { Loader } from "../components/loader/Loader.tsx";
import { SavingsChart } from "../components/savings-chart/SavingsChart.tsx";
import { Button, ButtonLink } from "../components/ui/Button.tsx";
import { Card } from "../components/ui/Card.tsx";
import { t } from "../i18n/en.ts";
import { buildActionSummary } from "../lib/action-summary.ts";
import { formatEur } from "../lib/format.ts";
import type { DecisionRow } from "../lib/sort-decisions.ts";
import css from "./Page.module.css";

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className={css.stat}>
      <span className={css.statIcon}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <strong className={css.statValue}>{value}</strong>
        <span className={css.statLabel}>{label}</span>
      </div>
    </div>
  );
}

/** Saved analyses from before the ADEME baseline have no baseline price. */
const isCurrentAnalysis = (result: FleetAnalysis): boolean =>
  result.vehicles.every(
    (v) => (v as { baselinePrice?: unknown }).baselinePrice,
  );

export function ResultsPage() {
  const { fleetId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const fleet = useGetFleetQuery(fleetId);
  const analysis = useGetLatestAnalysisQuery(fleetId);
  const [runAnalysis, runState] = useRunAnalysisMutation();
  const saved = analysis.data?.result;
  const result = saved && isCurrentAnalysis(saved) ? saved : undefined;
  const isStale = saved !== undefined && result === undefined;

  const vehicles = fleet.data?.vehicles;
  const nameOf = useCallback(
    (id: string) => {
      const v = vehicles?.find((item) => item.id === id);
      return v ? `${v.make} ${v.model}` : id;
    },
    [vehicles],
  );

  const rows = useMemo<DecisionRow[]>(
    () =>
      (result?.plan.entries ?? []).map((entry) => {
        const best = result?.vehicles.find(
          (v) => v.vehicleId === entry.vehicleId,
        )?.candidates[0];
        return {
          vehicleId: entry.vehicleId,
          vehicleName: nameOf(entry.vehicleId),
          make: vehicles?.find((v) => v.id === entry.vehicleId)?.make ?? "",
          evId: best?.ev.id ?? null,
          evBrand: best?.ev.brand ?? null,
          evName: best?.ev.variant ?? null,
          decision: entry.decision,
          year: entry.year,
          medianEur: best?.savings.medianEur ?? null,
          p10Eur: best?.savings.p10Eur ?? null,
          p90Eur: best?.savings.p90Eur ?? null,
          paybackShare: best?.savings.paybackShare ?? null,
          cvar10Eur: best?.savings.cvar10Eur ?? null,
        };
      }),
    [result, nameOf, vehicles],
  );

  const chartPoints = useMemo(
    () =>
      rows
        .flatMap((row) =>
          row.medianEur !== null && row.p10Eur !== null && row.p90Eur !== null
            ? {
                label: `${row.vehicleId} ${row.make}`,
                range: [row.p10Eur, row.p90Eur] as [number, number],
                medianEur: row.medianEur,
              }
            : [],
        )
        .sort((a, b) => b.medianEur - a.medianEur),
    [rows],
  );

  const openEv = useCallback(
    (evId: string, vehicleId: string) => {
      setSearchParams({ ev: evId, vehicle: vehicleId });
    },
    [setSearchParams],
  );
  const closeEv = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleRun = async () => {
    try {
      await runAnalysis(fleetId).unwrap();
    } catch (error) {
      toast.error((error as ApiQueryError).error.message);
    }
  };

  if (fleet.isLoading || analysis.isLoading) return <Loader />;
  if (!fleet.data || analysis.isError) {
    return <p role="alert">{t.common.genericError}</p>;
  }

  const replaced =
    result?.plan.entries.filter((e) => e.decision === "replace").length ?? 0;
  const openEvId = searchParams.get("ev");
  const openVehicleId = searchParams.get("vehicle");
  const openCandidate =
    result?.vehicles
      .find((v) => v.vehicleId === openVehicleId)
      ?.candidates.find((c) => c.ev.id === openEvId) ?? null;

  return (
    <>
      <div className={css.head}>
        <div>
          <h1>{t.results.title}</h1>
          <Link to={`/fleets/${fleetId}`}>{fleet.data.name}</Link>
        </div>
        <div className={css.actions}>
          <ButtonLink
            icon={SlidersHorizontal}
            to={`/fleets/${fleetId}/assumptions`}
          >
            {t.results.edit}
          </ButtonLink>
          <Button
            variant="primary"
            icon={result ? RefreshCw : Play}
            disabled={runState.isLoading}
            onClick={() => void handleRun()}
          >
            {result ? t.results.rerun : t.results.run}
          </Button>
        </div>
      </div>

      {runState.isLoading && <Loader />}
      {isStale && !runState.isLoading && (
        <Card role="status">
          <p className={css.note}>
            <CircleAlert size={16} aria-hidden="true" />
            {t.results.stale}
          </p>
        </Card>
      )}
      {!saved && !runState.isLoading && (
        <Card>
          <p className={css.muted}>{t.results.empty}</p>
        </Card>
      )}

      {result && (
        <>
          <ActionSummary text={buildActionSummary(result, nameOf)} />

          <div className={css.stats}>
            <Stat
              icon={ListChecks}
              value={`${String(replaced)} / ${String(result.vehicles.length)}`}
              label={t.results.toReplace}
            />
            <Stat
              icon={PiggyBank}
              value={formatEur(result.plan.totalMedianSavingsEur)}
              label={t.results.savings}
            />
            {result.plan.years.map((y) => (
              <Stat
                key={y.year}
                icon={CalendarDays}
                value={String(y.vehicleIds.length)}
                label={`${String(y.year)}: ${formatEur(y.spentEur)} / ${formatEur(y.budgetEur)} ${t.results.spent}`}
              />
            ))}
          </div>

          <Card>
            <h2 className={css.sectionTitle}>
              <TrendingUp size={18} aria-hidden="true" />
              {t.results.chartTitle}
            </h2>
            <SavingsChart points={chartPoints} />
          </Card>

          <Card>
            <h2 className={css.sectionTitle}>
              <TableProperties size={18} aria-hidden="true" />
              {t.results.decisions}
            </h2>
            <DecisionsTable
              rows={rows}
              analyses={result.vehicles}
              onOpenEv={openEv}
            />
          </Card>

          <p className={css.note}>
            <Info size={14} aria-hidden="true" />
            {t.results.limits}
          </p>

          {openEvId && (
            <EvModal
              key={openEvId}
              evId={openEvId}
              vehicleLabel={openVehicleId ? nameOf(openVehicleId) : null}
              candidate={openCandidate}
              winterRangeFactor={result.assumptions.winterRangeFactor}
              onClose={closeEv}
            />
          )}
        </>
      )}
    </>
  );
}
