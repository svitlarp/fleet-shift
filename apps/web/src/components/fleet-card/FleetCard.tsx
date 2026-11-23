import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CarFront,
  PiggyBank,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { FleetListItem } from "../../api/fleet-api.ts";
import { t } from "../../i18n/en.ts";
import { formatEur } from "../../lib/format.ts";
import { Button, ButtonLink } from "../ui/Button.tsx";
import css from "./FleetCard.module.css";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export function FleetCard({
  fleet,
  onDelete,
}: {
  fleet: FleetListItem;
  onDelete: (fleet: FleetListItem) => void;
}) {
  const latest = fleet.latestAnalysis;
  return (
    <article className={css.card}>
      <div className={css.head}>
        <span className={css.avatar}>
          <CarFront size={22} aria-hidden="true" />
        </span>
        <div className={css.titleBlock}>
          <h3 className={css.title}>
            <Link className={css.link} to={`/fleets/${fleet.id}`}>
              {fleet.name}
            </Link>
          </h3>
          <p className={css.meta}>
            <span>
              <CarFront size={13} aria-hidden="true" />
              {fleet.vehicleCount} {t.home.vehicles}
            </span>
            <span>
              <CalendarDays size={13} aria-hidden="true" />
              {date.format(new Date(fleet.createdAt))}
            </span>
          </p>
        </div>
        <ArrowRight className={css.arrow} size={18} aria-hidden="true" />
      </div>

      {latest ? (
        <dl className={css.stats}>
          <div>
            <dt>
              <RefreshCw size={13} aria-hidden="true" />
              {t.home.toReplace}
            </dt>
            <dd>
              {latest.replaceCount} / {fleet.vehicleCount}
            </dd>
          </div>
          <div>
            <dt>
              <PiggyBank size={13} aria-hidden="true" />
              {t.home.medianSavings}
            </dt>
            <dd>{formatEur(latest.medianSavingsEur)}</dd>
          </div>
        </dl>
      ) : (
        <p className={css.empty}>{t.home.notAnalyzed}</p>
      )}

      <div className={css.actions}>
        <ButtonLink
          variant={latest ? "secondary" : "primary"}
          icon={latest ? BarChart3 : Play}
          to={`/fleets/${fleet.id}/results`}
        >
          {latest ? t.home.viewResults : t.home.runFirst}
        </ButtonLink>
        <Button
          variant="ghost"
          className={css.delete}
          icon={Trash2}
          aria-label={`${t.common.delete} ${fleet.name}`}
          onClick={() => {
            onDelete(fleet);
          }}
        />
      </div>
    </article>
  );
}
