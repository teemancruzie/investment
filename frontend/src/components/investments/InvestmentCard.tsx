import { Link } from "@tanstack/react-router";
import type { Investment } from "@/services/investment.service";
import {
  RISK_LABEL,
  formatCompactCurrency,
  formatCurrency,
  formatDuration,
  formatPercent,
} from "@/lib/format";

const RISK_TONE: Record<string, string> = {
  low: "border-emerald-400/30 text-emerald-300/90",
  medium: "border-gold/40 text-gold",
  high: "border-orange-400/30 text-orange-300/90",
};

export function InvestmentCard({ investment }: { investment: Investment }) {
  const category = typeof investment.category === "object" ? investment.category?.name : undefined;
  const progress = Math.min(100, Math.max(0, investment.fundingProgress ?? 0));

  return (
    <Link
      to="/investments/$id"
      params={{ id: investment.slug || investment.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-gold/50"
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        {investment.image ? (
          <img
            src={investment.image}
            alt={investment.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {category ?? "Opportunity"}
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full border bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.14em] backdrop-blur ${
            RISK_TONE[investment.riskLevel] ?? RISK_TONE["medium"]
          }`}
        >
          {RISK_LABEL[investment.riskLevel] ?? "Moderate risk"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {category ?? "Private markets"}
          {investment.location ? ` · ${investment.location}` : ""}
        </p>
        <h3 className="mt-2 text-xl leading-snug">{investment.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {investment.summary}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Target</dt>
            <dd className="mt-1 text-gold">{formatPercent(investment.expectedAnnualReturn)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Term</dt>
            <dd className="mt-1">{formatDuration(investment.durationMonths)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Minimum</dt>
            <dd className="mt-1">{formatCurrency(investment.minimumInvestment)}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatCompactCurrency(investment.fundedAmount)} raised</span>
            <span>{progress.toFixed(0)}% of {formatCompactCurrency(investment.fundingGoal)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function InvestmentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="h-44 animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-1.5 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
