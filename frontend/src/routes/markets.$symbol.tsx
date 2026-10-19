import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { ACCOUNT_LABEL, ACCOUNT_TYPES, findCatalogEntry, type AccountType } from "@/lib/market/catalog";
import { marketKeys, marketService } from "@/services/market.service";
import { walletKeys, walletService } from "@/services/wallet.service";
import { formatCurrency } from "@/lib/format";
import { ChangeBadge, formatPrice, formatQty } from "@/components/markets/format";

export const Route = createFileRoute("/markets/$symbol")({
  head: ({ params }) => {
    const entry = findCatalogEntry(params.symbol);
    const name = entry ? `${entry.name} (${params.symbol})` : params.symbol;
    const title = `${name} live price & trading — Meridian Capital`;
    const description = `Live ${name} price, chart and fractional buying from $1 with Meridian Capital.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SymbolPage,
});

const RANGES = [
  { v: "1d", l: "1D" }, { v: "5d", l: "1W" }, { v: "1mo", l: "1M" },
  { v: "6mo", l: "6M" }, { v: "1y", l: "1Y" }, { v: "5y", l: "5Y" },
];

const selectClass = "h-11 w-full rounded-sm border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:border-gold";

function SymbolPage() {
  const { symbol } = Route.useParams();
  const [range, setRange] = useState("1mo");
  const entry = findCatalogEntry(symbol);

  const chartQuery = useQuery({
    queryKey: marketKeys.chart(symbol, range),
    queryFn: () => marketService.chart(symbol, range),
    refetchInterval: range === "1d" ? 30_000 : false,
  });
  const quote = chartQuery.data?.quote;
  const points = chartQuery.data?.points ?? [];
  const up = points.length > 1 ? points[points.length - 1]!.price >= points[0]!.price : true;
  const shortRange = range === "1d" || range === "5d";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-32 lg:px-8 lg:pt-40">
        <Link to="/investments" className="text-sm text-muted-foreground hover:text-foreground">← Browse deals</Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {entry?.classLabel ?? quote?.type ?? "Market"} · {quote?.exchange ?? "—"}
            </p>
            <h1 className="mt-3 text-3xl lg:text-4xl">{quote?.name ?? entry?.name ?? symbol}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl tabular-nums">{quote ? formatPrice(quote.price) : "…"}</span>
              {quote ? <ChangeBadge value={quote.changePercent} /> : null}
              <span className="text-xs text-muted-foreground">today</span>
            </div>

            <div className="mt-6 flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setRange(r.v)}
                  className={`rounded-sm px-3 py-1.5 text-xs ${r.v === range ? "bg-gold/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {r.l}
                </button>
              ))}
            </div>

            <div className="mt-4 h-72 rounded-xl border border-border/70 bg-card p-3">
              {chartQuery.isError ? (
                <p className="p-6 text-sm text-muted-foreground">Chart unavailable for this asset right now.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points}>
                    <defs>
                      <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={up ? "var(--success)" : "var(--destructive)"} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={up ? "var(--success)" : "var(--destructive)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="t"
                      tickFormatter={(t: number) => new Date(t).toLocaleDateString("en-US", shortRange ? { hour: "numeric" } : { month: "short", day: "numeric" })}
                      stroke="var(--muted-foreground)" fontSize={11} minTickGap={40}
                    />
                    <YAxis domain={["auto", "auto"]} stroke="var(--muted-foreground)" fontSize={11} width={60} tickFormatter={(v: number) => formatPrice(v)} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                      labelFormatter={(t) => new Date(Number(t)).toLocaleString("en-US")}
                      formatter={(v) => [formatPrice(Number(v)), "Price"]}
                    />
                    <Area type="monotone" dataKey="price" stroke={up ? "var(--success)" : "var(--destructive)"} fill="url(#px)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {quote ? (
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["Day range", quote.dayLow && quote.dayHigh ? `${formatPrice(quote.dayLow)} – ${formatPrice(quote.dayHigh)}` : "—"],
                  ["52-week range", quote.yearLow && quote.yearHigh ? `${formatPrice(quote.yearLow)} – ${formatPrice(quote.yearHigh)}` : "—"],
                  ["Volume", quote.volume ? quote.volume.toLocaleString("en-US") : "—"],
                  ["Updated", quote.time ? new Date(quote.time).toLocaleTimeString("en-US") : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border/70 bg-card p-4">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-sm tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>

          <TradePanel symbol={symbol} price={quote?.price ?? null} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function TradePanel({ symbol, price }: { symbol: string; price: number | null }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("100");
  const [account, setAccount] = useState<AccountType>("individual");

  const walletQuery = useQuery({ queryKey: walletKeys.wallet, queryFn: () => walletService.get(), enabled: isAuthenticated, retry: false });
  const holdingsQuery = useQuery({ queryKey: marketKeys.holdings, queryFn: () => marketService.holdings(), enabled: isAuthenticated, retry: false });
  const position = holdingsQuery.data?.items.find((h) => h.symbol === symbol.toUpperCase() && h.accountType === account);

  const value = Number(amount);
  const estQty = price && value > 0 ? value / price : 0;

  const mutation = useMutation({
    mutationFn: (sellAll: boolean) =>
      side === "buy"
        ? marketService.buy({ symbol, amount: value, accountType: account })
        : marketService.sell({ symbol, accountType: account, ...(sellAll ? { sellAll: true } : { amount: value }) }),
    onSuccess: ({ order }) => {
      toast.success(`${order.side === "buy" ? "Bought" : "Sold"} ${formatQty(order.quantity)} ${symbol} at ${formatPrice(order.price)}`);
      void queryClient.invalidateQueries({ queryKey: walletKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: ["market", "holdings"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <aside className="h-fit rounded-xl border border-border/70 bg-card p-6">
        <h2 className="text-xl">Invest in {symbol}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to buy from $1 using your wallet balance.</p>
        <Button asChild className="mt-5 w-full"><Link to="/login">Sign in</Link></Button>
      </aside>
    );
  }

  return (
    <aside className="h-fit rounded-xl border border-border/70 bg-card p-6">
      <div className="grid grid-cols-2 gap-1 rounded-sm bg-muted/40 p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button key={s} type="button" onClick={() => setSide(s)}
            className={`rounded-sm py-2 text-sm capitalize ${side === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {s}
          </button>
        ))}
      </div>

      <label className="mt-5 block text-xs text-muted-foreground">Account</label>
      <select className={`${selectClass} mt-1.5`} value={account} onChange={(e) => setAccount(e.target.value as AccountType)}>
        {ACCOUNT_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>

      <label className="mt-4 block text-xs text-muted-foreground">Amount (USD)</label>
      <Input className="mt-1.5 h-11" type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <div className="mt-4 space-y-1.5 text-sm">
        <Row k="Est. quantity" v={estQty ? formatQty(estQty) : "—"} />
        <Row k="Market price" v={price ? formatPrice(price) : "—"} />
        <Row k="Wallet balance" v={formatCurrency(walletQuery.data?.balance ?? 0, 2)} />
        <Row k={`You own (${ACCOUNT_LABEL[account]})`} v={position ? `${formatQty(position.quantity)} · ${formatCurrency(position.marketValue, 2)}` : "0"} />
      </div>

      <Button className="mt-5 w-full" disabled={!price || !(value >= 1) || mutation.isPending} onClick={() => mutation.mutate(false)}>
        {mutation.isPending ? "Placing order…" : `${side === "buy" ? "Buy" : "Sell"} ${formatCurrency(value || 0, 2)}`}
      </Button>
      {side === "sell" && position ? (
        <Button variant="outline" className="mt-2 w-full" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>
          Sell entire position
        </Button>
      ) : null}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Market orders fill instantly at the live price and settle against your wallet. Fractional quantities supported.
        Retirement accounts follow IRS contribution limits — consult a tax adviser.
      </p>
    </aside>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right tabular-nums">{v}</span>
    </div>
  );
}
