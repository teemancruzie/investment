import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { InvestmentCard, InvestmentCardSkeleton } from "@/components/investments/InvestmentCard";
import { InvestmentFilters } from "@/components/investments/InvestmentFilters";
import { investmentKeys, investmentService } from "@/services/investment.service";
import { MarketsBrowser } from "@/components/markets/MarketsBrowser";

const title = "Browse Deals — Stocks, ETFs, Crypto, Bonds & More | Meridian Capital";
const description =
  "Trade US stocks, ETFs, index funds, bonds, REITs, crypto and commodities at live prices from $1, plus vetted private deals.";

const searchSchema = z.object({
  view: fallback(z.enum(["markets", "deals"]), "markets").default("markets"),
  search: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  riskLevel: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "newest").default("newest"),
  page: fallback(z.number().int(), 1).default(1),
});

type SearchState = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/investments/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvestmentsPage,
});

const LIMIT = 9;

function InvestmentsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/investments/" });
  const page = Math.max(1, search.page);

  const categoriesQuery = useQuery({
    queryKey: investmentKeys.categories(),
    queryFn: () => investmentService.categories(),
    retry: false,
  });

  const query = {
    search: search.search,
    category: search.category,
    riskLevel: search.riskLevel,
    sort: search.sort,
    page,
    limit: LIMIT,
  };

  const listQuery = useQuery({
    queryKey: investmentKeys.list(query),
    queryFn: () => investmentService.list(query),
    placeholderData: keepPreviousData,
    retry: false,
  });

  function patch(next: Partial<SearchState>) {
    void navigate({
      search: (prev: SearchState) => ({ ...prev, ...next, page: next.page ?? 1 }),
    });
  }


  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-32 lg:px-8 lg:pt-40">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Browse deals</p>
          <h1 className="mt-4 text-4xl leading-tight lg:text-5xl">
            Every major market, <span className="text-gradient-gold">one wallet</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Trade US stocks, ETFs, index and mutual funds, bonds, REITs, crypto and commodities at live prices
            from $1 — or join our vetted private deals.
          </p>
        </header>

        <div className="mt-8 inline-flex rounded-sm border border-border/70 bg-card p-1">
          {([["markets", "Markets"], ["deals", "Private deals"]] as const).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => void navigate({ search: (prev: SearchState) => ({ ...prev, view: v }) })}
              className={`rounded-sm px-5 py-2 text-sm ${search.view === v ? "bg-gold/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {search.view === "markets" ? (
          <div className="mt-8">
            <MarketsBrowser />
          </div>
        ) : (
        <>
        <div className="mt-10">
          <InvestmentFilters
            value={{
              search: search.search,
              category: search.category,
              riskLevel: search.riskLevel,
              sort: search.sort,
            }}
            categories={categoriesQuery.data ?? []}
            onChange={patch}
          />
        </div>


        {listQuery.isError ? (
          <div className="mt-10 rounded-xl border border-border/70 bg-card p-8">
            <h2 className="text-xl">Opportunities are unavailable right now</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {(listQuery.error as Error).message}
            </p>
            <Button className="mt-6" onClick={() => void listQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {listQuery.isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <InvestmentCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-border/70 bg-card p-10 text-center">
            <h2 className="text-xl">No opportunities match those filters</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Widen your risk band or clear the search to see the full pipeline.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() =>
                void navigate({ search: { view: "deals", search: "", category: "", riskLevel: "", sort: "newest", page: 1 } })
              }
            >
              Clear filters
            </Button>
          </div>
        ) : null}

        {items.length > 0 ? (
          <>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((investment) => (
                <InvestmentCard key={investment.id ?? investment._id} investment={investment} />
              ))}
            </div>

            {meta && meta.totalPages > 1 ? (
              <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => patch({ page: page - 1 })}
                >
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
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
