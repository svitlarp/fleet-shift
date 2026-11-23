import { Lightbulb } from "lucide-react";
import { t } from "../../i18n/en.ts";
import css from "./ActionSummary.module.css";

export function ActionSummary({ text }: { text: string }) {
  return (
    <aside className={css.summary} aria-label={t.summary.title}>
      <span className={css.icon}>
        <Lightbulb size={20} aria-hidden="true" />
      </span>
      <div>
        <h2 className={css.title}>{t.summary.title}</h2>
        <p>{text}</p>
      </div>
    </aside>
  );
}
