import { ErrorMessage, Field } from "formik";
import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import { InfoTip } from "./InfoTip.tsx";
import css from "./Form.module.css";

interface FormFieldProps {
  name: string;
  label: string;
  icon: LucideIcon;
  type?: "text" | "number" | "date";
  hint?: string;
}

export function FormField({
  name,
  label,
  icon: Icon,
  type = "text",
  hint,
}: FormFieldProps) {
  const inputId = useId();
  return (
    <div className={css.field}>
      <span className={css.labelRow}>
        <label className={css.label} htmlFor={inputId}>
          {label}
        </label>
        {hint && <InfoTip label={label} text={hint} />}
      </span>
      <span className={css.control}>
        <Icon className={css.icon} size={16} aria-hidden="true" />
        <Field
          id={inputId}
          className={css.input}
          name={name}
          type={type}
          step={type === "number" ? "any" : undefined}
        />
      </span>
      <ErrorMessage name={name} component="span" className={css.error} />
    </div>
  );
}

export function SwitchField({
  name,
  label,
  icon: Icon,
}: Pick<FormFieldProps, "name" | "label" | "icon">) {
  return (
    <label className={css.switchField}>
      <Field className={css.switchInput} name={name} type="checkbox" />
      <span className={css.switchTrack} aria-hidden="true" />
      <Icon size={16} aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className={css.grid}>{children}</div>;
}
