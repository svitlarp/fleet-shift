import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import css from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface StyleProps {
  variant?: Variant;
  icon?: LucideIcon;
  children?: ReactNode;
}

const classes = (variant: Variant, className = "") =>
  `${css.button} ${css[variant] ?? ""} ${className}`.trim();

export function Button({
  variant = "secondary",
  icon: Icon,
  children,
  className,
  type = "button",
  ...props
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes(variant, className)} {...props}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  icon: Icon,
  children,
  className,
  ...props
}: StyleProps & LinkProps) {
  return (
    <Link className={classes(variant, className)} {...props}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </Link>
  );
}

export const buttonClass = (variant: Variant = "secondary") => classes(variant);
