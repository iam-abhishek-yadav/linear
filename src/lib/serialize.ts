export function toIsoString(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}

export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  return value instanceof Date ? value : new Date(value);
}
