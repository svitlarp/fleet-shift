import { t } from "../../i18n/en.ts";
import css from "./Loader.module.css";

export function Loader() {
  return (
    <div className={css.wrap} role="status">
      <span className={css.spinner} aria-hidden="true" />
      <span className={css.label}>{t.common.loading}</span>
    </div>
  );
}
