import type { EvCandidateResult } from "@fleetshift/core";
import {
  BatteryCharging,
  Building2,
  CarFront,
  ExternalLink,
  Euro,
  Gauge,
  Leaf,
  MapPin,
  Route,
  Scale,
  Snowflake,
  Tag,
  Users,
  Weight,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGetEvDetailsQuery } from "../../api/fleet-api.ts";
import { t } from "../../i18n/en.ts";
import { formatEur, formatPercent } from "../../lib/format.ts";
import { BrandLogo } from "../brand-logo/BrandLogo.tsx";
import { Loader } from "../loader/Loader.tsx";
import { Badge } from "../ui/Badge.tsx";
import { Button } from "../ui/Button.tsx";
import { BodyIllustration } from "./BodyIllustration.tsx";
import css from "./EvModal.module.css";

interface EvModalProps {
  evId: string;
  vehicleLabel: string | null;
  candidate: EvCandidateResult | null;
  winterRangeFactor: number;
  onClose: () => void;
}

const withUnit = (value: number | null, unit: string): string | null =>
  value === null ? null : `${value.toLocaleString("en-GB")} ${unit}`;

function Spec({
  icon: Icon,
  label,
  value,
  assumed = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  assumed?: boolean;
}) {
  return (
    <div className={css.spec}>
      <dt>
        <Icon size={14} aria-hidden="true" />
        {label}
      </dt>
      <dd className={value === null ? css.missing : undefined}>
        {value ?? t.ev.notAvailable}{" "}
        {assumed && <Badge>{t.provenance.assumption}</Badge>}
      </dd>
    </div>
  );
}

export function EvModal({
  evId,
  vehicleLabel,
  candidate,
  winterRangeFactor,
  onClose,
}: EvModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const details = useGetEvDetailsQuery(evId);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const data = details.data;
  const ev = data?.ev;
  const name = ev ? `${ev.brand} ${ev.variant}` : t.common.loading;
  const photo = photoFailed ? null : (data?.photo ?? null);

  return (
    <dialog
      ref={dialogRef}
      className={css.dialog}
      aria-label={name}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className={css.panel}>
        <Button
          variant="ghost"
          className={css.close}
          icon={X}
          aria-label={t.ev.close}
          onClick={onClose}
        />
        {details.isLoading && <Loader />}
        {details.isError && <p role="alert">{t.ev.loadError}</p>}
        {ev && data && (
          <>
            <div className={css.hero}>
              {photo ? (
                <img
                  className={css.photo}
                  src={`/cars/${photo.file}`}
                  alt={`${ev.brand} ${ev.model}`}
                  onError={() => {
                    setPhotoFailed(true);
                  }}
                />
              ) : (
                <BodyIllustration bodyType={ev.bodyType} />
              )}
            </div>
            <p className={css.credit}>
              {photo ? (
                <>
                  {t.ev.photoBy}: {photo.author},{" "}
                  <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                    Wikimedia Commons
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                  ,{" "}
                  {photo.licenseUrl ? (
                    <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
                      {photo.license}
                    </a>
                  ) : (
                    photo.license
                  )}
                  . {t.ev.illustrative}
                </>
              ) : (
                t.ev.noPhoto
              )}
            </p>

            <header className={css.header}>
              <BrandLogo brand={ev.brand} size={44} />
              <div>
                <h2>
                  {ev.brand} {ev.variant}
                </h2>
                <p className={css.price}>{formatEur(ev.priceEur)}</p>
              </div>
            </header>

            {candidate && vehicleLabel && (
              <section className={css.comparison}>
                <h3>{t.ev.forVehicle(vehicleLabel)}</h3>
                <dl className={css.comparisonGrid}>
                  <div>
                    <dt>{t.ev.median}</dt>
                    <dd>{formatEur(candidate.savings.medianEur)}</dd>
                  </div>
                  <div>
                    <dt>{t.ev.range1090}</dt>
                    <dd>
                      {formatEur(candidate.savings.p10Eur)} to{" "}
                      {formatEur(candidate.savings.p90Eur)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.ev.payback}</dt>
                    <dd>{formatPercent(candidate.savings.paybackShare)}</dd>
                  </div>
                  <div>
                    <dt>{t.ev.tco}</dt>
                    <dd>{formatEur(candidate.tco.totalEur)}</dd>
                  </div>
                </dl>
              </section>
            )}

            <h3 className={css.sectionTitle}>{t.ev.specs}</h3>
            <dl className={css.specs}>
              <Spec
                icon={Euro}
                label={t.ev.price}
                value={formatEur(ev.priceEur)}
              />
              <Spec
                icon={Route}
                label={t.ev.range}
                value={withUnit(ev.rangeKm, "km")}
              />
              <Spec
                icon={Snowflake}
                label={t.ev.winterRange}
                value={withUnit(
                  Math.round(ev.rangeKm * winterRangeFactor),
                  "km",
                )}
                assumed
              />
              <Spec
                icon={MapPin}
                label={t.ev.urbanRange}
                value={withUnit(ev.urbanRangeKm, "km")}
              />
              <Spec
                icon={Leaf}
                label={t.ev.consumption}
                value={withUnit(ev.kwhPer100Km, "kWh/100 km")}
              />
              <Spec
                icon={BatteryCharging}
                label={t.ev.battery}
                value={withUnit(data.batteryKwh, "kWh")}
              />
              <Spec icon={Zap} label={t.ev.charging} value={null} />
              <Spec
                icon={Gauge}
                label={t.ev.power}
                value={withUnit(ev.powerKw, "kW")}
              />
              <Spec
                icon={Weight}
                label={t.ev.weight}
                value={withUnit(ev.emptyWeightKg, "kg")}
              />
              <Spec
                icon={Users}
                label={t.ev.seats}
                value={String(data.seatsAssumed)}
                assumed
              />
              <Spec
                icon={Scale}
                label={t.ev.fiscalPower}
                value={withUnit(ev.fiscalPower, "CV")}
              />
              <Spec icon={CarFront} label={t.ev.body} value={ev.bodyType} />
              <Spec icon={Tag} label={t.ev.segment} value={ev.segment} />
              <Spec icon={Building2} label={t.ev.group} value={ev.group} />
            </dl>
            <p className={css.credit}>
              {t.ev.source}:{" "}
              <a href={data.source.url} target="_blank" rel="noreferrer">
                {data.source.name}
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}
