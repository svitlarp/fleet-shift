import * as RadixSelect from "@radix-ui/react-select";
import { useField } from "formik";
import { Check, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import formCss from "./Form.module.css";
import css from "./FormSelect.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  label: string;
  icon: LucideIcon;
  options: readonly SelectOption[];
}

export function FormSelect({
  name,
  label,
  icon: Icon,
  options,
}: FormSelectProps) {
  const [field, , helpers] = useField<string>(name);
  const labelId = useId();
  return (
    <div className={formCss.field}>
      <span className={formCss.label} id={labelId}>
        {label}
      </span>
      <RadixSelect.Root
        value={field.value}
        onValueChange={(value) => void helpers.setValue(value)}
      >
        <RadixSelect.Trigger
          className={css.trigger}
          aria-labelledby={labelId}
          onBlur={() => void helpers.setTouched(true)}
        >
          <Icon className={css.leading} size={16} aria-hidden="true" />
          <span className={css.value}>
            <RadixSelect.Value />
          </span>
          <RadixSelect.Icon className={css.chevron}>
            <ChevronDown size={16} aria-hidden="true" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className={css.content}
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className={css.viewport}>
              {options.map((option) => (
                <RadixSelect.Item
                  className={css.item}
                  key={option.value}
                  value={option.value}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={css.indicator}>
                    <Check size={15} aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
