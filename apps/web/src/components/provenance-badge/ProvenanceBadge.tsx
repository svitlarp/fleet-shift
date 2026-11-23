import type { ValueSource } from "@fleetshift/core";
import { Database, Lightbulb, PenLine } from "lucide-react";
import { t } from "../../i18n/en.ts";
import { Badge } from "../ui/Badge.tsx";

const ICONS = {
  open_data: Database,
  user: PenLine,
  assumption: Lightbulb,
} as const;

export function ProvenanceBadge({ source }: { source: ValueSource }) {
  return <Badge icon={ICONS[source]}>{t.provenance[source]}</Badge>;
}
