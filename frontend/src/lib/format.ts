/** Shared display formatters for money, percentages and dates. */

export function formatCurrency(value: number | undefined | null, maximumFractionDigits = 0) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(amount);
}

export function formatCompactCurrency(value: number | undefined | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercent(value: number | undefined | null, digits = 1) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

export function formatDate(value: string | Date | undefined | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function formatDuration(months: number | undefined | null) {
  const value = Number(months ?? 0);
  if (!value) return "—";
  if (value % 12 === 0) return `${value / 12} yr${value === 12 ? "" : "s"}`;
  return `${value} months`;
}

export const RISK_LABEL: Record<string, string> = {
  low: "Lower risk",
  medium: "Moderate risk",
  high: "Higher risk",
};
