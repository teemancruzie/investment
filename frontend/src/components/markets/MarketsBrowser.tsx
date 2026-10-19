import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { ASSET_CLASSES, type AssetClassId } from "@/lib/market/catalog";
import { marketKeys, marketService } from "@/services/market.service";
import { formatPrice, ChangeBadge } from "./format";

export function MarketsBrowser() {
  const [classId, setClassId] = useState<AssetClassId>("stocks");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(id);
  }, [term]);

  const cls = ASSET_CLASSES.find((c) => c.id === classId) ?? ASSET_CLASSES[0]!;

  const searchQuery = useQuery({
    queryKey: marketKeys.search(debounced),
    queryFn: () => marketService.search(debounced),
    enabled: debounced.length > 0,
  });

  const rows = useMemo(
    () =>
      debounced
        ? (searchQuery.data ?? []).map((h) => ({ symbol: h.symbol, name: h.name, group: `Search results` }))
        : cls.entries,
    [debounced, searchQuery.data, cls],
  );
  const symbols = rows.map((r) => r.symbol);

  const quotesQuery = useQuery({
    queryKey: marketKeys.quotes(symbols),
    queryFn: () => marketService.quotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 30_000,
  });

  const groups = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search any US stock, ETF, fund or coin — e.g. Palantir, VOO, Bitcoin"
        className="h-12"
        aria-label="Search markets"
      />

      {!debounced ? (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {ASSET_CLASSES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClassId(c.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                c.id === classId ? "border-gold bg-gold/10 text-foreground" : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      {!debounced ? <p className="mt-4 text-sm text-muted-foreground">{cls.blurb}</p> : null}

      {debounced && searchQuery.isFetching ? <p className="mt-6 text-sm text-muted-foreground">Searching…</p> : null}
      {debounced && !searchQuery.isFetching && rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No tradable US assets match “{debounced}”.</p>
      ) : null}

      <div className="mt-6 space-y-8">
        {Object.entries(groups).map(([group, list]) => (
          <section key={group}>
            <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{group}</h3>
            <div className="mt-3 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
              {list.map((row) => {
                const q = quotesQuery.data?.[row.symbol.toUpperCase()];
                return (
                  <Link
                    key={row.symbol}
                    to="/markets/$symbol"
                    params={{ symbol: row.symbol }}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{row.symbol.replace("-USD", "")}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums">{q ? formatPrice(q.price) : quotesQuery.isLoading ? "…" : "—"}</p>
                      {q ? <ChangeBadge value={q.changePercent} /> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Live prices, refreshed every 30 seconds. Stock and fund prices may be delayed up to 15 minutes.</p>
    </div>
  );
}
