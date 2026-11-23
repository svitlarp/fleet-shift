import type {
  CostComponentId,
  PlanDecision,
  VehicleAnalysis,
} from "@fleetshift/core";
import { Fragment, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useGetFleetQuery,
  useGetLatestAnalysisQuery,
  useRunAnalysisMutation,
} from "../api/fleet-api.ts";
import { Loader } from "../components/loader/Loader.tsx";
import { ProvenanceBadge } from "../components/provenance-badge/ProvenanceBadge.tsx";
import { SavingsChart } from "../components/savings-chart/SavingsChart.tsx";
import { t } from "../i18n/en.ts";
import { formatEur, formatPercent } from "../lib/format.ts";

const DECISION_BADGE: Record<PlanDecision, string> = {
  replace: "badge badge-good",
  over_budget: "badge badge-warn",
  not_profitable: "badge badge-bad",
  no_suitable_ev: "badge badge-bad",
  outside_horizon: "badge",
};

function VehicleDetails({ analysis }: { analysis: VehicleAnalysis }) {
  const rejected = Object.entries(analysis.rejections)
    .map(
      ([reason, count]) =>
        `${t.rejectionLabels[reason as keyof typeof t.rejectionLabels]}: ${String(count)}`,
    )
    .join(", ");
  const componentIds = Object.keys(
    analysis.baselineTco.breakdown,
  ) as CostComponentId[];
  return (
    <div style={{ padding: "8px 0" }}>
      <p className="muted">
        {t.results.charging(
          analysis.charging.stationsInRadius,
          analysis.charging.fastStationsInRadius,
        )}
        {rejected && ` · ${rejected}`}
      </p>
      <table>
        <thead>
          <tr>
            <th>{t.results.top3}</th>
            <th className="num">{t.results.tco}</th>
            {componentIds.map((id) => (
              <th className="num" key={id}>
                {t.components[id]}{" "}
                <ProvenanceBadge
                  source={analysis.baselineTco.provenance[id] ?? "assumption"}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t.results.baseline}</td>
            <td className="num">{formatEur(analysis.baselineTco.totalEur)}</td>
            {componentIds.map((id) => (
              <td className="num" key={id}>
                {formatEur(analysis.baselineTco.breakdown[id] ?? 0)}
              </td>
            ))}
          </tr>
          {analysis.candidates.map((c) => (
            <tr key={c.ev.id}>
              <td>
                {c.ev.brand} {c.ev.variant}
              </td>
              <td className="num">{formatEur(c.tco.totalEur)}</td>
              {componentIds.map((id) => (
                <td className="num" key={id}>
                  {formatEur(c.tco.breakdown[id] ?? 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsPage() {
  const { fleetId = "" } = useParams();
  const fleet = useGetFleetQuery(fleetId);
  const analysis = useGetLatestAnalysisQuery(fleetId);
  const [runAnalysis, runState] = useRunAnalysisMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const result = analysis.data?.result;

  const names = useMemo(
    () =>
      new Map(
        fleet.data?.vehicles.map((v) => [v.id, `${v.make} ${v.model}`]) ?? [],
      ),
    [fleet.data],
  );
  const chartPoints = useMemo(
    () =>
      (result?.vehicles ?? [])
        .flatMap((v) => {
          const best = v.candidates[0];
          if (!best) return [];
          return {
            label: `${v.vehicleId} ${names.get(v.vehicleId)?.split(" ")[0] ?? ""}`,
            range: [best.savings.p10Eur, best.savings.p90Eur] as [
              number,
              number,
            ],
            medianEur: best.savings.medianEur,
          };
        })
        .sort((a, b) => b.medianEur - a.medianEur),
    [result, names],
  );

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

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.results.title}</h1>
          <Link to={`/fleets/${fleetId}`}>{fleet.data.name}</Link>
        </div>
        <div className="actions">
          <Link className="btn" to={`/fleets/${fleetId}/assumptions`}>
            {t.results.edit}
          </Link>
          <button
            className="btn btn-primary"
            type="button"
            disabled={runState.isLoading}
            onClick={() => void handleRun()}
          >
            {result ? t.results.rerun : t.results.run}
          </button>
        </div>
      </div>

      {runState.isLoading && <Loader />}
      {!result && !runState.isLoading && (
        <p className="card muted">{t.results.empty}</p>
      )}

      {result && (
        <>
          <div className="stats">
            <div className="stat">
              <strong>
                {replaced} / {result.vehicles.length}
              </strong>
              {t.results.toReplace}
            </div>
            <div className="stat">
              <strong>{formatEur(result.plan.totalMedianSavingsEur)}</strong>
              {t.results.savings}
            </div>
            {result.plan.years.map((y) => (
              <div className="stat" key={y.year}>
                <strong>{y.vehicleIds.length}</strong>
                {y.year}: {formatEur(y.spentEur)} / {formatEur(y.budgetEur)}{" "}
                {t.results.spent}
              </div>
            ))}
          </div>

          <p className="card muted">{t.results.limits}</p>

          <section className="card">
            <h2>{t.results.chartTitle}</h2>
            <SavingsChart points={chartPoints} />
          </section>

          <section className="card table-wrap">
            <h2>{t.results.decisions}</h2>
            <table>
              <thead>
                <tr>
                  <th>{t.results.vehicle}</th>
                  <th>{t.results.bestEv}</th>
                  <th>{t.results.decision}</th>
                  <th>{t.results.year}</th>
                  <th className="num">{t.results.median}</th>
                  <th className="num">{t.results.range}</th>
                  <th className="num">{t.results.payback}</th>
                  <th className="num">{t.results.cvar}</th>
                  <th>{t.results.details}</th>
                </tr>
              </thead>
              <tbody>
                {result.plan.entries.map((entry) => {
                  const vehicle = result.vehicles.find(
                    (v) => v.vehicleId === entry.vehicleId,
                  );
                  const best = vehicle?.candidates[0];
                  const isOpen = expandedId === entry.vehicleId;
                  return (
                    <Fragment key={entry.vehicleId}>
                      <tr>
                        <td className="wrap-cell">
                          {names.get(entry.vehicleId) ?? entry.vehicleId}
                          <div className="muted">{entry.vehicleId}</div>
                        </td>
                        <td className="wrap-cell">
                          {best ? `${best.ev.brand} ${best.ev.variant}` : "-"}
                        </td>
                        <td>
                          <span className={DECISION_BADGE[entry.decision]}>
                            {t.decisionLabels[entry.decision]}
                          </span>
                        </td>
                        <td>{entry.year ?? "-"}</td>
                        <td className="num">
                          {best ? formatEur(best.savings.medianEur) : "-"}
                        </td>
                        <td className="num">
                          {best
                            ? `${formatEur(best.savings.p10Eur)} to ${formatEur(best.savings.p90Eur)}`
                            : "-"}
                        </td>
                        <td className="num">
                          {best
                            ? formatPercent(best.savings.paybackShare)
                            : "-"}
                        </td>
                        <td className="num">
                          {best ? formatEur(best.savings.cvar10Eur) : "-"}
                        </td>
                        <td>
                          <button
                            className="btn"
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => {
                              setExpandedId(isOpen ? null : entry.vehicleId);
                            }}
                          >
                            {t.results.details}
                          </button>
                        </td>
                      </tr>
                      {isOpen && vehicle && (
                        <tr>
                          <td colSpan={9}>
                            <VehicleDetails analysis={vehicle} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
