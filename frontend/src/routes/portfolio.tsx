import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { investmentKeys, investmentService, type Investment, type UserInvestment } from "@/services/investment.service";
import { walletService, walletKeys } from "@/services/wallet.service";
import { formatCurrency, formatDate, formatPercent, RISK_LABEL } from "@/lib/format";
import { MarketHoldings } from "@/components/markets/MarketHoldings";

const title = "Your Portfolio — Meridian Capital";
const description = "Every position you hold: units owned, capital deployed, earned returns and total portfolio value.";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

function investmentOf(position: UserInvestment): Partial<Investment> {
  return typeof position.investment === "object" && position.investment !== null
    ? (position.investment as Partial<Investment>)
    : {};
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PortfolioPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const positionsQuery = useQuery({
    queryKey: investmentKeys.mine(),
    queryFn: () => investmentService.mine({ limit: 100 }),
    enabled: isAuthenticated,
    retry: false,
  });

  const walletQuery = useQuery({
    queryKey: walletKeys.wallet,
    queryFn: () => walletService.get(),
    enabled: isAuthenticated,
    retry: false,
  });

  const positions = positionsQuery.data?.items ?? [];
  const invested = positions.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const earned = positions.reduce((sum, p) => sum + Number(p.earnedReturn ?? 0), 0);
  const projected = positions.reduce((sum, p) => sum + Number(p.expectedReturn ?? 0), 0);
  const units = positions.reduce((sum, p) => sum + Number(p.units ?? 0), 0);
  const activeCount = positions.filter((p) => p.status === "active").length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-32 lg:px-8 lg:pt-40">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Client area</p>
          <h1 className="mt-4 text-4xl leading-tight lg:text-5xl">
            Your <span className="text-gradient-gold">portfolio</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            A live view of every position you hold — units owned, capital deployed, returns earned to date
            and total value across the book.
          </p>
        </header>

        {!authLoading && !isAuthenticated ? (
          <div className="mt-10 rounded-xl border border-border/70 bg-card p-10">
            <h2 className="text-xl">Sign in to view your holdings</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your portfolio is private to your account.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">Open account</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {isAuthenticated ? (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total value"
                value={formatCurrency(invested + earned)}
                hint="Capital deployed plus returns earned"
              />
              <StatCard label="Capital invested" value={formatCurrency(invested)} hint={`${activeCount} active positions`} />
              <StatCard label="Returns earned" value={formatCurrency(earned)} hint={`${formatCurrency(projected)} projected`} />
              <StatCard
                label="Units owned"
                value={units.toLocaleString("en-US")}
                hint={`Wallet: ${formatCurrency(walletQuery.data?.balance ?? 0)}`}
              />
            </div>

            {positionsQuery.isError ? (
              <div className="mt-10 rounded-xl border border-border/70 bg-card p-8">
                <h2 className="text-xl">Holdings are unavailable right now</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {(positionsQuery.error as Error).message}
                </p>
                <Button className="mt-6" onClick={() => void positionsQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : null}

            {positionsQuery.isLoading ? (
              <div className="mt-10 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl border border-border/70 bg-card" />
                ))}
              </div>
            ) : null}

            {!positionsQuery.isLoading && !positionsQuery.isError && positions.length === 0 ? (
              <div className="mt-10 rounded-xl border border-border/70 bg-card p-10 text-center">
                <h2 className="text-xl">You don't hold any positions yet</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Browse the pipeline and make your first allocation.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/investments">View opportunities</Link>
                </Button>
              </div>
            ) : null}

            {positions.length > 0 ? (
              <div className="mt-10 overflow-hidden rounded-xl border border-border/70 bg-card">
                <div className="hidden grid-cols-12 gap-4 border-b border-border/70 px-6 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground lg:grid">
                  <span className="col-span-4">Position</span>
                  <span className="col-span-2 text-right">Units</span>
                  <span className="col-span-2 text-right">Invested</span>
                  <span className="col-span-2 text-right">Earned</span>
                  <span className="col-span-2 text-right">Value</span>
                </div>

                <ul className="divide-y divide-border/70">
                  {positions.map((position) => {
                    const inv = investmentOf(position);
                    const value = Number(position.amount ?? 0) + Number(position.earnedReturn ?? 0);
                    return (
                      <li
                        key={position.id ?? position._id}
                        className="grid grid-cols-2 gap-4 px-6 py-5 lg:grid-cols-12 lg:items-center"
                      >
                        <div className="col-span-2 lg:col-span-4">
                          <p className="text-base">
                            {inv.slug || inv.id || inv._id ? (
                              <Link
                                to="/investments/$id"
                                params={{ id: String(inv.slug ?? inv.id ?? inv._id) }}
                                className="transition-colors hover:text-gold"
                              >
                                {inv.title ?? "Investment"}
                              </Link>
                            ) : (
                              (inv.title ?? "Investment")
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {position.status} · opened {formatDate(position.createdAt)}
                            {inv.riskLevel ? ` · ${RISK_LABEL[inv.riskLevel] ?? inv.riskLevel}` : ""}
                            {inv.expectedAnnualReturn
                              ? ` · ${formatPercent(inv.expectedAnnualReturn)} target`
                              : ""}
                          </p>
                        </div>
                        <Cell label="Units" value={Number(position.units ?? 0).toLocaleString("en-US")} />
                        <Cell label="Invested" value={formatCurrency(position.amount)} />
                        <Cell label="Earned" value={formatCurrency(position.earnedReturn ?? 0)} />
                        <Cell label="Value" value={formatCurrency(value)} strong />
                      </li>
                    );
                  })}
                </ul>

                <div className="grid grid-cols-2 gap-4 border-t border-border/70 px-6 py-5 text-sm lg:grid-cols-12 lg:items-center">
                  <span className="col-span-2 uppercase tracking-[0.16em] text-muted-foreground lg:col-span-4">
                    Total
                  </span>
                  <Cell label="Units" value={units.toLocaleString("en-US")} strong />
                  <Cell label="Invested" value={formatCurrency(invested)} strong />
                  <Cell label="Earned" value={formatCurrency(earned)} strong />
                  <Cell label="Value" value={formatCurrency(invested + earned)} strong />
                </div>
              </div>
            ) : null}
            <MarketHoldings />
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="lg:col-span-2 lg:text-right">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground lg:hidden">{label}</p>
      <p className={strong ? "text-base" : "text-sm"}>{value}</p>
    </div>
  );
}
