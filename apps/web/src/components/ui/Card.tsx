import type { HTMLAttributes } from "react";
import css from "./Card.module.css";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={`${css.card} ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}
