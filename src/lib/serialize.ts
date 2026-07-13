export function toIsoString(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}
