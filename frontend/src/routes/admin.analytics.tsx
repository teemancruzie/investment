import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminKeys, adminService } from "@/services/admin.service";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const queryClient = useQueryClient();

  const overview = useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => adminService.overview(),
    retry: false,
  });

  const preview = useQuery({
    queryKey: ["admin", "payouts", "preview"],
    queryFn: () => adminService.payoutPreview(),
    retry: false,
  });

  const run = useMutation({
    mutationFn: () => adminService.runPayouts(),
    onSuccess: (result) => {
      toast.success(`Payout sweep complete · ${formatCurrency(result.accruedValue + result.principalReturned)} credited`);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (overview.isError) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {(overview.error as Error).message}
      </p>
    );
  }

  if (overview.isLoading || !overview.data) {
    return <p className="text-sm text-muted-foreground">Loading analytics…</p>;
  }

  const { stats, charts, recentUsers, recentInvestments } = overview.data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Investors" value={String(stats.totalUsers)} hint={`${stats.activeInvestors} funded`} />
        <Stat label="Capital raised" value={formatCurrency(stats.totalInvested)} hint={`${stats.activeInvestments} active positions`} />
        <Stat label="Returns paid" value={formatCurrency(stats.totalReturns)} />
        <Stat label="Deals" value={String(stats.totalInvestments)} hint={formatCurrency(stats.revenue) + " revenue"} />
      </div>

      <section className="rounded-lg border border-border/70 bg-card/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Returns engine</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.isLoading
                ? "Calculating accruals…"
                : preview.isError
                  ? (preview.error as Error).message
                  : `${preview.data?.accrued ?? 0} positions accruing · ${formatCurrency(
                      (preview.data?.accruedValue ?? 0) + (preview.data?.principalReturned ?? 0)
                    )} pending`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void preview.refetch()} disabled={preview.isFetching}>
              Refresh preview
            </Button>
            <Button onClick={() => run.mutate()} disabled={run.isPending}>
              {run.isPending ? "Running…" : "Run payout sweep"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Investor growth">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.growth}>
              <defs>
                <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
              />
              <Area type="monotone" dataKey="users" stroke="var(--color-gold)" fill="url(#usersFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Capital deployed">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.volume}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="invested" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Allocation by category">
        <div className="divide-y divide-border/60">
          {charts.byCategory.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3 text-sm">
              <span>{row.label}</span>
              <span className="text-muted-foreground">
                {row.count} deals · {formatCurrency(row.funded)}
              </span>
            </div>
          ))}
          {charts.byCategory.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No category data yet.</p>
          ) : null}
        </div>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Newest investors">
          <div className="divide-y divide-border/60">
            {recentUsers.map((user) => (
              <div key={user.email} className="flex items-center justify-between py-3 text-sm">
                <span>
                  {user.firstName} {user.lastName}
                  <span className="ml-2 text-muted-foreground">{user.email}</span>
                </span>
                <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
              </div>
            ))}
            {recentUsers.length === 0 ? <p className="py-3 text-sm text-muted-foreground">No signups yet.</p> : null}
          </div>
        </ChartCard>

        <ChartCard title="Latest allocations">
          <div className="divide-y divide-border/60">
            {recentInvestments.map((row, index) => (
              <div key={`${row.createdAt}-${index}`} className="flex items-center justify-between py-3 text-sm">
                <span className="min-w-0 truncate">
                  {row.user ? `${row.user.firstName} ${row.user.lastName}` : "Investor"}
                  <span className="ml-2 text-muted-foreground">{row.investment?.title ?? "Deal"}</span>
                </span>
                <span className="text-gold">{formatCurrency(row.amount)}</span>
              </div>
            ))}
            {recentInvestments.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No allocations yet.</p>
            ) : null}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/40 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border/70 bg-card/40 p-6">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
