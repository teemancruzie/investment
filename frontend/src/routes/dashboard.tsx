import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { dashboardKeys, dashboardService } from "@/services/dashboard.service";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

const title = "Your Dashboard — Meridian Capital";
const description = "Portfolio value, active investments, wallet balance and recent transactions.";

export const Route = createFileRoute("/dashboard")({
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
  component: DashboardPage,
});

const SLICE_COLORS = ["#C8A45C", "#8FA6C4", "#5C7FA8", "#A98B4A", "#3E5573", "#D9C79A"];

function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: dashboardKeys.root,
    queryFn: () => dashboardService.get(),
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 60_000,
  });

  const stats = query.data?.stats;
  const monthly = query.data?.charts.monthly ?? [];
  const allocation = query.data?.charts.allocation ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 lg:px-8">
        {authLoading ? (
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        ) : !isAuthenticated ? (
          <SignedOut />
        ) : (
          <>
            <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Client area</p>
                <h1 className="mt-3 font-display text-4xl md:text-5xl">
                  Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/wallet">Fund wallet</Link>
                </Button>
                <Button asChild>
                  <Link to="/investments">Browse deals</Link>
                </Button>
              </div>
            </header>

            {query.isError ? (
              <p className="mb-8 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {(query.error as Error).message}
              </p>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LiveValue base={stats?.portfolioValue ?? 0} investments={query.data?.recentInvestments ?? []} />
              <Stat
                label="Capital invested"
                value={formatCurrency(stats?.totalInvested, 2)}
                hint={`${stats?.activeInvestments ?? 0} active positions`}
              />
              <Stat
                label="Returns earned"
                value={formatCurrency(stats?.totalReturns, 2)}
                hint={`${formatCurrency(stats?.expectedReturns, 2)} projected`}
              />
              <Stat
                label="Wallet balance"
                value={formatCurrency(stats?.walletBalance, 2)}
                hint={
                  stats?.pendingTransactions
                    ? `${stats.pendingTransactions} pending request(s)`
                    : "No pending requests"
                }
              />
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-card/40 p-6 lg:col-span-2">
                <h2 className="font-display text-2xl">Capital vs. returns</h2>
                <p className="mt-1 text-sm text-muted-foreground">Completed ledger activity by month.</p>
                <div className="mt-6 h-64">
                  {monthly.length === 0 ? (
                    <Empty text="No activity to chart yet." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthly}>
                        <defs>
                          <linearGradient id="investedFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C8A45C" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#C8A45C" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="returnsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8FA6C4" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#8FA6C4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.35)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.35)" width={70} />
                        <Tooltip
                          contentStyle={{ background: "#131E33", border: "1px solid rgba(200,164,92,0.3)" }}
                          formatter={(value: number) => formatCurrency(value, 2)}
                        />
                        <Area
                          type="monotone"
                          dataKey="invested"
                          name="Invested"
                          stroke="#C8A45C"
                          fill="url(#investedFill)"
                        />
                        <Area
                          type="monotone"
                          dataKey="returns"
                          name="Returns"
                          stroke="#8FA6C4"
                          fill="url(#returnsFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-card/40 p-6">
                <h2 className="font-display text-2xl">Allocation</h2>
                <p className="mt-1 text-sm text-muted-foreground">Active capital by sector.</p>
                <div className="mt-6 h-64">
                  {allocation.length === 0 ? (
                    <Empty text="No active allocations." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocation}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {allocation.map((entry, index) => (
                            <Cell key={entry.label} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#131E33", border: "1px solid rgba(200,164,92,0.3)" }}
                          formatter={(value: number) => formatCurrency(value, 2)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-card/40 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">Recent positions</h2>
                  <Link to="/portfolio" className="text-sm text-gold hover:underline">
                    View portfolio
                  </Link>
                </div>
                <div className="mt-5 space-y-4">
                  {(query.data?.recentInvestments ?? []).map((position, index) => (
                    <div key={position.id ?? position._id ?? index} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{position.investment?.title ?? "Deal"}</p>
                        <p className="text-xs text-muted-foreground">
                          {position.units} units · {formatDate(position.createdAt)}
                          {position.investment?.expectedAnnualReturn
                            ? ` · ${formatPercent(position.investment.expectedAnnualReturn)}`
                            : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm">{formatCurrency(position.amount, 2)}</p>
                        <p className="text-xs text-emerald-400">
                          +{formatCurrency(position.earnedReturn ?? 0, 2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(query.data?.recentInvestments ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No positions yet —{" "}
                      <Link to="/investments" className="text-gold hover:underline">
                        explore opportunities
                      </Link>
                      .
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-card/40 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">Recent activity</h2>
                  <Link to="/transactions" className="text-sm text-gold hover:underline">
                    All transactions
                  </Link>
                </div>
                <div className="mt-5 space-y-4">
                  {(query.data?.recentTransactions ?? []).map((tx, index) => (
                    <div key={tx.id ?? tx._id ?? index} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm capitalize">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant="outline" className="border-border/70 capitalize">
                          {tx.status}
                        </Badge>
                        <span className="text-sm">{formatCurrency(tx.amount, 2)}</span>
                      </div>
                    </div>
                  ))}
                  {(query.data?.recentTransactions ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/40 px-5 py-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`mt-3 font-display text-3xl ${accent ? "text-gold" : ""}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Ticks the portfolio value up between refreshes using each active position's annual rate. */
function LiveValue({
  base,
  investments,
}: {
  base: number;
  investments: { amount: number; status: string; investment?: { expectedAnnualReturn?: number } | null }[];
}) {
  const perSecond = investments
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.amount * (p.investment?.expectedAnnualReturn ?? 0)) / 100 / 31_536_000, 0);
  const [start, setStart] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => setStart(Date.now()), [base]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const value = base + perSecond * Math.max(0, (now - start) / 1000);
  return (
    <Stat
      label="Portfolio value · live"
      value={formatCurrency(value, 4)}
      hint={perSecond > 0 ? `+${formatCurrency(perSecond * 86_400, 2)} per day` : "Invest to start earning"}
      accent
    />
  );
}

function Empty({ text }: { text: string }) {
  return <div className="grid h-full place-items-center text-sm text-muted-foreground">{text}</div>;
}

function SignedOut() {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-border/70 bg-card/40 p-8 text-center">
      <h1 className="font-display text-3xl">Sign in required</h1>
      <p className="mt-3 text-sm text-muted-foreground">Your dashboard is available once you sign in.</p>
      <Button asChild className="mt-6">
        <Link to="/login">Sign in</Link>
      </Button>
    </div>
  );
}
