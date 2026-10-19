import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ACCOUNT_LABEL } from "@/lib/market/catalog";
import { marketKeys, marketService } from "@/services/market.service";
import { formatCurrency } from "@/lib/format";
import { ChangeBadge, formatPrice, formatQty } from "./format";

/** Listed-market positions (stocks, ETFs, crypto…) valued at live prices. */
export function MarketHoldings() {
  const query = useQuery({ queryKey: marketKeys.holdings, queryFn: () => marketService.holdings(), retry: false, refetchInterval: 60_000 });
  const items = query.data?.items ?? [];
  const totals = query.data?.totals;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">Market holdings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Stocks, funds, bonds, crypto and commodities at live prices.</p>
        </div>
        {totals ? (
          <div className="text-right">
            <p className="text-2xl tabular-nums">{formatCurrency(totals.marketValue, 2)}</p>
            <p className={`text-xs ${totals.unrealizedPnl >= 0 ? "text-success" : "text-destructive"}`}>
              {totals.unrealizedPnl >= 0 ? "+" : ""}{formatCurrency(totals.unrealizedPnl, 2)} unrealized
            </p>
          </div>
        ) : null}
      </div>

      {query.isError ? <p className="mt-6 text-sm text-muted-foreground">{(query.error as Error).message}</p> : null}
      {!query.isLoading && !query.isError && items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
          No market holdings yet. <Link to="/investments" className="text-gold underline">Browse markets</Link>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border/70 bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="p-4">Asset</th><th className="p-4">Account</th><th className="p-4 text-right">Quantity</th>
                <th className="p-4 text-right">Price</th><th className="p-4 text-right">Value</th><th className="p-4 text-right">Gain / loss</th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b border-border/40 last:border-0">
                  <td className="p-4">
                    <Link to="/markets/$symbol" params={{ symbol: h.symbol }} className="font-medium hover:text-gold">{h.symbol}</Link>
                    <p className="text-xs text-muted-foreground">{h.name}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">{ACCOUNT_LABEL[h.accountType] ?? h.accountType}</td>
                  <td className="p-4 text-right tabular-nums">{formatQty(h.quantity)}</td>
                  <td className="p-4 text-right tabular-nums">{formatPrice(h.price)}<br /><ChangeBadge value={h.changePercent} /></td>
                  <td className="p-4 text-right tabular-nums">{formatCurrency(h.marketValue, 2)}</td>
                  <td className={`p-4 text-right tabular-nums ${h.unrealizedPnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {h.unrealizedPnl >= 0 ? "+" : ""}{formatCurrency(h.unrealizedPnl, 2)}
                    <br /><span className="text-xs">{h.unrealizedPct.toFixed(2)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
