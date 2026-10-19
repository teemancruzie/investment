import { useCountUp } from "@/hooks/useCountUp";

type Stat = { value: number; prefix?: string; suffix?: string; decimals?: number; label: string };

const STATS: Stat[] = [
  { value: 428, prefix: "$", suffix: "M", label: "Capital deployed" },
  { value: 32400, suffix: "+", label: "Active investors" },
  { value: 11.8, suffix: "%", decimals: 1, label: "Weighted net return" },
  { value: 96, suffix: "%", label: "Projects on schedule" },
];

function StatItem({ stat }: { stat: Stat }) {
  const { ref, display } = useCountUp(stat.value);
  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: stat.decimals ?? 0,
    maximumFractionDigits: stat.decimals ?? 0,
  });

  return (
    <div className="border-l border-border pl-6">
      <span ref={ref} className="font-display text-4xl text-foreground lg:text-5xl">
        {stat.prefix}
        {formatted}
        {stat.suffix}
      </span>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
    </div>
  );
}

export function Stats() {
  return (
    <section className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <StatItem key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
