import type { FormikErrors } from "formik";
import { setIn } from "formik";
import type { ZodType } from "zod";

/** Adapts a shared zod schema to Formik's validate prop. */
export function zodValidate<T>(schema: ZodType) {
  return (values: T): FormikErrors<T> => {
    const parsed = schema.safeParse(values);
    if (parsed.success) return {};
    let errors: FormikErrors<T> = {};
    for (const issue of parsed.error.issues) {
      errors = setIn(
        errors,
        issue.path.join("."),
        issue.message,
      ) as FormikErrors<T>;
    }
    return errors;
  };
}
