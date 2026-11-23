export type ValueSource = "open_data" | "user" | "assumption";

export interface Sourced<T> {
  value: T;
  source: ValueSource;
  ref?: string;
}

export function sourced<T>(
  value: T,
  source: ValueSource,
  ref?: string,
): Sourced<T> {
  return ref === undefined ? { value, source } : { value, source, ref };
}
