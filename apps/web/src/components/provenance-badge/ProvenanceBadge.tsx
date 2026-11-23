import type { ValueSource } from "@fleetshift/core";
import { t } from "../../i18n/en.ts";

export function ProvenanceBadge({ source }: { source: ValueSource }) {
  return <span className="badge">{t.provenance[source]}</span>;
}
