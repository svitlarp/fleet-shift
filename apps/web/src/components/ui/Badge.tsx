import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import css from "./Badge.module.css";

export type BadgeTone = "neutral" | "good" | "warn" | "bad";

export function Badge({
  tone = "neutral",
  icon: Icon,
  children,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className={`${css.badge} ${css[tone] ?? ""}`}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}
