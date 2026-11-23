import { referenceKey } from "@fleetshift/core";
import {
  siAudi,
  siBmw,
  siCitroen,
  siDacia,
  siFiat,
  siHonda,
  siHyundai,
  siKia,
  siMazda,
  siMg,
  siMini,
  siNissan,
  siOpel,
  siPeugeot,
  siPorsche,
  siRenault,
  siSkoda,
  siSubaru,
  siTesla,
  siToyota,
  siVolkswagen,
} from "simple-icons";
import css from "./BrandLogo.module.css";

const LOGO_PATHS: Readonly<Record<string, string>> = {
  AUDI: siAudi.path,
  BMW: siBmw.path,
  CITROEN: siCitroen.path,
  DACIA: siDacia.path,
  FIAT: siFiat.path,
  HONDA: siHonda.path,
  HYUNDAI: siHyundai.path,
  KIA: siKia.path,
  MAZDA: siMazda.path,
  MG: siMg.path,
  MINI: siMini.path,
  NISSAN: siNissan.path,
  OPEL: siOpel.path,
  PEUGEOT: siPeugeot.path,
  PORSCHE: siPorsche.path,
  RENAULT: siRenault.path,
  SKODA: siSkoda.path,
  SUBARU: siSubaru.path,
  TESLA: siTesla.path,
  TOYOTA: siToyota.path,
  VOLKSWAGEN: siVolkswagen.path,
};

export function BrandLogo({
  brand,
  size = 32,
}: {
  brand: string;
  size?: number;
}) {
  const key = referenceKey(brand);
  const path = LOGO_PATHS[key];
  const style = { width: size, height: size };
  if (!path) {
    return (
      <span className={css.logo} style={style} aria-hidden="true">
        <span className={css.monogram}>{key.slice(0, 2)}</span>
      </span>
    );
  }
  return (
    <span className={css.logo} style={style} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="62%" height="62%" fill="currentColor">
        <path d={path} />
      </svg>
    </span>
  );
}
