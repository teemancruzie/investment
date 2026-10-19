import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { adminKeys, adminService } from "@/services/admin.service";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const overview = useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => adminService.overview(),
    retry: false,
  });

  const summary = useQuery({
    queryKey: adminKeys.summary,
    queryFn: () => adminService.requestSummary(),
    retry: false,
  });

  if (overview.isLoading) return <p className="text-sm text-muted-foreground">Loading console…</p>;
  if (overview.isError) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {(overview.error as Error).message}
      </p>
    );
  }

  const stats = overview.data?.stats;
  const pending = summary.data;

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Investors" value={String(stats?.totalUsers ?? 0)} hint={`${stats?.activeInvestors ?? 0} active`} />
        <Stat label="Capital invested" value={formatCurrency(stats?.totalInvested)} />
        <Stat label="Returns paid" value={formatCurrency(stats?.totalReturns)} />
        <Stat
          label="Pending funding"
          accent
          value={formatCurrency((pending?.depositValue ?? 0) + (pending?.withdrawalValue ?? 0))}
          hint={`${pending?.deposits ?? 0} deposits · ${pending?.withdrawals ?? 0} withdrawals`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-card/40 p-6">
          <h2 className="font-display text-2xl">Capital by category</h2>
          <div className="mt-5 space-y-3">
            {(overview.data?.charts.byCategory ?? []).map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span>{formatCurrency(row.funded)}</span>
              </div>
            ))}
            {(overview.data?.charts.byCategory ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No funded deals yet.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/40 p-6">
          <h2 className="font-display text-2xl">Latest allocations</h2>
          <div className="mt-5 space-y-3">
            {(overview.data?.recentInvestments ?? []).map((row, index) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">
                  {row.user ? `${row.user.firstName} ${row.user.lastName}` : "Investor"} ·{" "}
                  {row.investment?.title ?? "Deal"}
                </span>
                <span className="shrink-0">{formatCurrency(row.amount)}</span>
              </div>
            ))}
            {(overview.data?.recentInvestments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No allocations yet.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border/70 bg-card/40 p-6">
        <h2 className="font-display text-2xl">Newest investors</h2>
        <div className="mt-5 space-y-3">
          {(overview.data?.recentUsers ?? []).map((row) => (
            <div key={row.email} className="flex items-center justify-between gap-4 text-sm">
              <span className="min-w-0 truncate">
                {row.firstName} {row.lastName}
                <span className="ml-2 text-muted-foreground">{row.email}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">{formatDate(row.createdAt)}</span>
            </div>
          ))}
          {(overview.data?.recentUsers ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No signups yet.</p>
          ) : null}
        </div>
      </section>
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
