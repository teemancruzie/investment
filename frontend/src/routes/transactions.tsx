import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { transactionKeys, transactionService, type Transaction } from "@/services/wallet.service";
import { formatCurrency, formatDate } from "@/lib/format";

const title = "Transactions — Meridian Capital";
const description =
  "Every deposit, withdrawal, investment, return and fee on your account, filterable by type and date range.";

const searchSchema = z.object({
  type: fallback(z.string(), "").default(""),
  status: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
  page: fallback(z.number().int(), 1).default(1),
});

type SearchState = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/transactions")({
  validateSearch: zodValidator(searchSchema),
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
  component: TransactionsPage,
});

const LIMIT = 15;

const TYPES = [
  { value: "", label: "All types" },
  { value: "deposit", label: "Deposits" },
  { value: "investment", label: "Investments" },
  { value: "return", label: "Returns" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "fee", label: "Fees" },
  { value: "purchase", label: "Market buys" },
  { value: "sale", label: "Market sells" },
];

const STATUSES = [
  { value: "", label: "Any status" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const CREDIT_TYPES = new Set(["deposit", "return", "sale"]);

const selectClass =
  "h-11 w-full rounded-sm border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:border-gold";

function statusClass(status: Transaction["status"]) {
  if (status === "completed") return "border-gold/40 text-gold";
  if (status === "pending") return "border-border text-muted-foreground";
  return "border-destructive/50 text-destructive";
}

function TransactionsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/transactions" });
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const page = Math.max(1, search.page);

  const query = {
    type: search.type,
    status: search.status,
    from: search.from,
    to: search.to,
    page,
    limit: LIMIT,
  };

  const listQuery = useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: () => transactionService.list(query),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    retry: false,
  });

  function patch(next: Partial<SearchState>) {
    void navigate({ search: (prev: SearchState) => ({ ...prev, ...next, page: next.page ?? 1 }) });
  }

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const hasFilters = Boolean(search.type || search.status || search.from || search.to);

  const credited = items
    .filter((t) => CREDIT_TYPES.has(t.type) && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
  const debited = items
    .filter((t) => !CREDIT_TYPES.has(t.type) && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-32 lg:px-8 lg:pt-40">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Client area</p>
          <h1 className="mt-4 text-4xl leading-tight lg:text-5xl">
            Your <span className="text-gradient-gold">transactions</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            A complete ledger of deposits, allocations, returns, withdrawals and fees. Filter by type,
            status or date range — the URL keeps your view shareable.
          </p>
        </header>

        {!authLoading && !isAuthenticated ? (
          <div className="mt-10 rounded-xl border border-border/70 bg-card p-10">
            <h2 className="text-xl">Sign in to view your ledger</h2>
            <p className="mt-3 text-sm text-muted-foreground">Transaction history is private to your account.</p>
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
            <div className="mt-10 grid gap-4 rounded-xl border border-border/70 bg-card p-5 md:grid-cols-2 lg:grid-cols-5">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Type</span>
                <select
                  className={selectClass}
                  value={search.type}
                  onChange={(e) => patch({ type: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Status</span>
                <select
                  className={selectClass}
                  value={search.status}
                  onChange={(e) => patch({ status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted-foreground">From</span>
                <Input
                  type="date"
                  className="h-11"
                  value={search.from}
                  max={search.to || undefined}
                  onChange={(e) => patch({ from: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted-foreground">To</span>
                <Input
                  type="date"
                  className="h-11"
                  value={search.to}
                  min={search.from || undefined}
                  onChange={(e) => patch({ to: e.target.value })}
                />
              </label>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  disabled={!hasFilters}
                  onClick={() =>
                    void navigate({ search: { type: "", status: "", from: "", to: "", page: 1 } })
                  }
                >
                  Clear filters
                </Button>
              </div>
            </div>

            {listQuery.isError ? (
              <div className="mt-10 rounded-xl border border-border/70 bg-card p-8">
                <h2 className="text-xl">Transactions are unavailable right now</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {(listQuery.error as Error).message}
                </p>
                <Button className="mt-6" onClick={() => void listQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : null}

            {listQuery.isLoading ? (
              <div className="mt-10 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl border border-border/70 bg-card" />
                ))}
              </div>
            ) : null}

            {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
              <div className="mt-10 rounded-xl border border-border/70 bg-card p-10 text-center">
                <h2 className="text-xl">No transactions match this view</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {hasFilters
                    ? "Widen the date range or clear the type filter."
                    : "Fund your wallet or make an allocation and it will appear here."}
                </p>
                <Button asChild className="mt-6">
                  <Link to="/investments">View opportunities</Link>
                </Button>
              </div>
            ) : null}

            {items.length > 0 ? (
              <>
                <div className="mt-10 overflow-hidden rounded-xl border border-border/70 bg-card">
                  <div className="hidden grid-cols-12 gap-4 border-b border-border/70 px-6 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground lg:grid">
                    <span className="col-span-3">Date</span>
                    <span className="col-span-4">Details</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-3 text-right">Amount</span>
                  </div>

                  <ul className="divide-y divide-border/70">
                    {items.map((tx) => {
                      const credit = CREDIT_TYPES.has(tx.type);
                      return (
                        <li
                          key={tx.id ?? tx._id}
                          className="grid gap-2 px-6 py-5 lg:grid-cols-12 lg:items-center lg:gap-4"
                        >
                          <span className="text-sm text-muted-foreground lg:col-span-3">
                            {formatDate(tx.createdAt)}
                          </span>
                          <div className="lg:col-span-4">
                            <p className="text-base capitalize">{tx.type}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {tx.description || tx.reference || "—"}
                            </p>
                          </div>
                          <span className="lg:col-span-2">
                            <span
                              className={`inline-block rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.12em] ${statusClass(tx.status)}`}
                            >
                              {tx.status}
                            </span>
                          </span>
                          <div className="lg:col-span-3 lg:text-right">
                            <p className={`text-base ${credit ? "text-gold" : ""}`}>
                              {credit ? "+" : "−"}
                              {formatCurrency(Math.abs(Number(tx.amount ?? 0)), 2)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Balance {formatCurrency(tx.balanceAfter, 2)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-6 py-4 text-sm text-muted-foreground">
                    <span>
                      Showing {items.length} of {meta?.total ?? items.length} transactions
                    </span>
                    <span>
                      In {formatCurrency(credited, 2)} · Out {formatCurrency(debited, 2)} (this page)
                    </span>
                  </div>
                </div>

                {meta && meta.totalPages > 1 ? (
                  <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">
                    <Button variant="outline" disabled={page <= 1} onClick={() => patch({ page: page - 1 })}>
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {meta.page} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= meta.totalPages}
                      onClick={() => patch({ page: page + 1 })}
                    >
                      Next
                    </Button>
                  </nav>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
