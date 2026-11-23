import { ErrorMessage, Field } from "formik";
import type { LucideIcon } from "lucide-react";
import css from "./Form.module.css";

interface FormFieldProps {
  name: string;
  label: string;
  icon: LucideIcon;
  type?: "text" | "number" | "date";
}

export function FormField({
  name,
  label,
  icon: Icon,
  type = "text",
}: FormFieldProps) {
  return (
    <label className={css.field}>
      <span className={css.label}>{label}</span>
      <span className={css.control}>
        <Icon className={css.icon} size={16} aria-hidden="true" />
        <Field
          className={css.input}
          name={name}
          type={type}
          step={type === "number" ? "any" : undefined}
        />
      </span>
      <ErrorMessage name={name} component="span" className={css.error} />
    </label>
  );
}

export function SwitchField({
  name,
  label,
  icon: Icon,
}: Omit<FormFieldProps, "type">) {
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
