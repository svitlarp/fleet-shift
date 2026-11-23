import type {
  CostComponentId,
  PlanDecision,
  VehicleAnalysis,
} from "@fleetshift/core";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  ChevronDown,
  CircleCheck,
  CircleSlash,
  Eye,
  Wallet,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { t } from "../../i18n/en.ts";
import { formatEur, formatPercent } from "../../lib/format.ts";
import {
  DEFAULT_SORT,
  nextSort,
  sortDecisions,
} from "../../lib/sort-decisions.ts";
import type {
  DecisionRow,
  SortKey,
  SortState,
} from "../../lib/sort-decisions.ts";
import { BrandLogo } from "../brand-logo/BrandLogo.tsx";
import { ProvenanceBadge } from "../provenance-badge/ProvenanceBadge.tsx";
import { Badge } from "../ui/Badge.tsx";
import type { BadgeTone } from "../ui/Badge.tsx";
import tableCss from "../ui/Table.module.css";
import css from "./DecisionsTable.module.css";

const DECISION_STYLE: Record<
  PlanDecision,
  { tone: BadgeTone; icon: LucideIcon }
> = {
  replace: { tone: "good", icon: CircleCheck },
  over_budget: { tone: "warn", icon: Wallet },
  not_profitable: { tone: "bad", icon: CircleSlash },
  no_suitable_ev: { tone: "bad", icon: XCircle },
  outside_horizon: { tone: "neutral", icon: CalendarClock },
};

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "vehicleName", label: t.results.vehicle },
  { key: "evName", label: t.results.bestEv },
  { key: "decision", label: t.results.decision },
  { key: "year", label: t.results.year },
  { key: "medianEur", label: t.results.median, numeric: true },
  { key: "p10Eur", label: t.results.range, numeric: true },
  { key: "paybackShare", label: t.results.payback, numeric: true },
  { key: "cvar10Eur", label: t.results.cvar, numeric: true },
];

function SortHeader({
  column,
  sort,
  onSort,
}: {
  column: (typeof COLUMNS)[number];
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === column.key;
  const Icon = !active
    ? ArrowUpDown
    : sort.direction === "asc"
      ? ArrowUp
      : ArrowDown;
  const ariaSort = !active
    ? "none"
    : sort.direction === "asc"
      ? "ascending"
      : "descending";
  return (
    <th
      aria-sort={ariaSort}
      className={column.numeric ? tableCss.num : undefined}
    >
      <button
        type="button"
        className={`${css.sort} ${active ? css.sortActive : ""}`}
        aria-label={t.results.sortBy(column.label)}
        onClick={() => {
          onSort(column.key);
        }}
      >
        {column.label}
        <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}

function VehicleDetails({
  analysis,
  onOpenEv,
}: {
  analysis: VehicleAnalysis;
  onOpenEv: (evId: string, vehicleId: string) => void;
}) {
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
    <div className={css.details}>
      <p className={tableCss.muted}>
        {t.results.baselinePrice}: {formatEur(analysis.baselinePrice.priceEur)}{" "}
        <ProvenanceBadge source={analysis.baselinePrice.source} /> ·{" "}
        {t.results.charging(
          analysis.charging.stationsInRadius,
          analysis.charging.fastStationsInRadius,
        )}
        {rejected && ` · ${rejected}`}
      </p>
      <div className={tableCss.wrap}>
        <table className={tableCss.table}>
          <thead>
            <tr>
              <th>{t.results.top3}</th>
              <th className={tableCss.num}>{t.results.tco}</th>
              {componentIds.map((id) => (
                <th className={tableCss.num} key={id}>
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
              <td className={tableCss.num}>
                {formatEur(analysis.baselineTco.totalEur)}
              </td>
              {componentIds.map((id) => (
                <td className={tableCss.num} key={id}>
                  {formatEur(analysis.baselineTco.breakdown[id] ?? 0)}
                </td>
              ))}
            </tr>
            {analysis.candidates.map((c) => {
              const name = `${c.ev.brand} ${c.ev.variant}`;
              return (
                <tr key={c.ev.id}>
                  <td>
                    <button
                      type="button"
                      className={css.evLink}
                      aria-label={t.results.viewEv(name)}
                      onClick={() => {
                        onOpenEv(c.ev.id, analysis.vehicleId);
                      }}
                    >
                      <BrandLogo brand={c.ev.brand} size={24} />
                      {name}
                      <Eye size={14} aria-hidden="true" />
                    </button>
                  </td>
                  <td className={tableCss.num}>{formatEur(c.tco.totalEur)}</td>
                  {componentIds.map((id) => (
                    <td className={tableCss.num} key={id}>
                      {formatEur(c.tco.breakdown[id] ?? 0)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DecisionsTable({
  rows,
  analyses,
  onOpenEv,
}: {
  rows: DecisionRow[];
  analyses: readonly VehicleAnalysis[];
  onOpenEv: (evId: string, vehicleId: string) => void;
}) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = useMemo(() => sortDecisions(rows, sort), [rows, sort]);

  return (
    <div className={tableCss.wrap}>
      <table className={tableCss.table}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <SortHeader
                key={column.key}
                column={column}
                sort={sort}
                onSort={(key) => {
                  setSort((current) => nextSort(current, key));
                }}
              />
            ))}
            <th>
              <span className={css.srOnly}>{t.results.details}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const style = DECISION_STYLE[row.decision];
            const isOpen = expandedId === row.vehicleId;
            const analysis = analyses.find(
              (a) => a.vehicleId === row.vehicleId,
            );
            const evLabel = row.evName
              ? `${row.evBrand ?? ""} ${row.evName}`
              : "";
            const hasEv = row.medianEur !== null;
            return (
              <Fragment key={row.vehicleId}>
                <tr>
                  <td className={tableCss.wrapCell}>
                    <span className={tableCss.vehicle}>
                      <BrandLogo brand={row.make} />
                      <span>
                        {row.vehicleName}
                        <span className={css.subline}>{row.vehicleId}</span>
                      </span>
                    </span>
                  </td>
                  <td className={tableCss.wrapCell}>
                    {row.evId && row.evBrand ? (
                      <button
                        type="button"
                        className={css.evLink}
                        aria-label={t.results.viewEv(evLabel)}
                        onClick={() => {
                          if (row.evId) onOpenEv(row.evId, row.vehicleId);
                        }}
                      >
                        <BrandLogo brand={row.evBrand} size={24} />
                        <span>{evLabel}</span>
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <Badge tone={style.tone} icon={style.icon}>
                      {t.decisionLabels[row.decision]}
                    </Badge>
                  </td>
                  <td>{row.year ?? "-"}</td>
                  <td className={tableCss.num}>
                    {hasEv ? formatEur(row.medianEur ?? 0) : "-"}
                  </td>
                  <td className={tableCss.num}>
                    {hasEv
                      ? `${formatEur(row.p10Eur ?? 0)} to ${formatEur(row.p90Eur ?? 0)}`
                      : "-"}
                  </td>
                  <td className={tableCss.num}>
                    {hasEv ? formatPercent(row.paybackShare ?? 0) : "-"}
                  </td>
                  <td className={tableCss.num}>
                    {hasEv ? formatEur(row.cvar10Eur ?? 0) : "-"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${css.expand} ${isOpen ? css.expandOpen : ""}`}
                      aria-expanded={isOpen}
                      aria-label={`${t.results.details} ${row.vehicleId}`}
                      onClick={() => {
                        setExpandedId(isOpen ? null : row.vehicleId);
                      }}
                    >
                      <ChevronDown size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
                {isOpen && analysis && (
                  <tr>
                    <td colSpan={COLUMNS.length + 1}>
                      <VehicleDetails analysis={analysis} onOpenEv={onOpenEv} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
