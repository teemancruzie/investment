export function formatPrice(value: number) {
  const digits = value < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatQty(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`text-xs tabular-nums ${up ? "text-success" : "text-destructive"}`}>
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}
