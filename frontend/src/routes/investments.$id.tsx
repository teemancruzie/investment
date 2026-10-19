import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { InvestDialog } from "@/components/investments/InvestDialog";
import { investmentKeys, investmentService } from "@/services/investment.service";
import {
  RISK_LABEL,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDuration,
  formatPercent,
} from "@/lib/format";

export const Route = createFileRoute("/investments/$id")({
  head: () => ({
    meta: [
      { title: "Opportunity detail — Meridian Capital" },
      {
        name: "description",
        content:
          "Full diligence detail for a Meridian Capital opportunity: target return, term, minimum, funding progress and risk band.",
      },
      { property: "og:title", content: "Opportunity detail — Meridian Capital" },
      {
        property: "og:description",
        content: "Target return, term, minimum, funding progress and risk band for this opportunity.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvestmentDetailPage,
});

function InvestmentDetailPage() {
  const { id } = Route.useParams();

  const query = useQuery({
    queryKey: investmentKeys.detail(id),
    queryFn: () => investmentService.get(id),
    retry: false,
  });

  const investment = query.data;
  const category =
    investment && typeof investment.category === "object" ? investment.category?.name : undefined;
  const progress = Math.min(100, Math.max(0, investment?.fundingProgress ?? 0));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-32 lg:px-8 lg:pt-40">
        <Link to="/investments" className="text-sm text-muted-foreground hover:text-gold">
          ← All opportunities
        </Link>

        {query.isLoading ? (
          <div className="mt-8 space-y-6">
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : null}

        {query.isError ? (
          <div className="mt-10 rounded-xl border border-border/70 bg-card p-8">
            <h1 className="text-2xl">This opportunity could not be loaded</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {(query.error as Error).message}
            </p>
            <Button className="mt-6" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {investment ? (
          <div className="mt-8 grid gap-12 lg:grid-cols-[1.7fr_1fr]">
            <article>
              <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
                {investment.image ? (
                  <img
                    src={investment.image}
                    alt={investment.title}
                    className="h-[22rem] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[22rem] items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {category ?? "Opportunity"}
                  </div>
                )}
              </div>

              <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {category ?? "Private markets"}
                {investment.location ? ` · ${investment.location}` : ""}
              </p>
              <h1 className="mt-3 text-4xl leading-tight lg:text-5xl">{investment.title}</h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">{investment.summary}</p>

              <div className="mt-10 gold-rule w-24" />

              <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                {investment.description}
              </div>

              <dl className="mt-12 grid gap-6 border-t border-border/60 pt-8 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Risk band" value={RISK_LABEL[investment.riskLevel] ?? "Moderate risk"} />
                <Stat label="Term" value={formatDuration(investment.durationMonths)} />
                <Stat label="Opens" value={formatDate(investment.startDate)} />
                <Stat label="Closes" value={formatDate(investment.endDate)} />
              </dl>
            </article>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-xl border border-border/70 bg-card p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Target annual return
                </p>
                <p className="mt-2 text-4xl text-gold">
                  {formatPercent(investment.expectedAnnualReturn)}
                </p>

                <div className="mt-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{formatCompactCurrency(investment.fundedAmount)} raised</span>
                    <span>{formatCompactCurrency(investment.fundingGoal)} goal</span>
                  </div>
                </div>

                <dl className="mt-6 space-y-3 border-t border-border/60 pt-6 text-sm">
                  <Row label="Minimum" value={formatCurrency(investment.minimumInvestment)} />
                  <Row label="Units available" value={String(investment.availableUnits ?? 0)} />
                  <Row
                    label="Unit price"
                    value={formatCurrency(
                      investment.totalUnits ? investment.fundingGoal / investment.totalUnits : 0
                    )}
                  />
                  <Row label="Status" value={investment.status} />
                </dl>

                <div className="mt-6">
                  <InvestDialog investment={investment} />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Capital at risk. Past performance is not indicative of future results.
                </p>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-lg">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="capitalize">{value}</dd>
    </div>
  );
}
