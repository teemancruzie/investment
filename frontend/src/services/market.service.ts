import { apiRequest } from "./api";
import { requestList } from "./list";
import type { ChartPoint, MarketQuote, SearchHit } from "@/lib/market/types";
import type { AccountType } from "@/lib/market/catalog";

export type Holding = {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  accountType: AccountType;
  quantity: number;
  averageCost: number;
  realizedPnl: number;
  price: number;
  changePercent: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPct: number;
};

export type HoldingsResponse = {
  items: Holding[];
  totals: { marketValue: number; costBasis: number; realizedPnl: number; unrealizedPnl: number };
};

export type Order = {
  _id: string;
  side: "buy" | "sell";
  symbol: string;
  name: string;
  accountType: AccountType;
  quantity: number;
  price: number;
  amount: number;
  realizedPnl: number;
  createdAt: string;
};

async function market<T>(qs: string): Promise<T> {
  const res = await fetch(`/api/market?${qs}`);
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Market data is unavailable right now");
  return body;
}

export const marketService = {
  async quotes(symbols: string[]) {
    if (!symbols.length) return {} as Record<string, MarketQuote>;
    const { quotes } = await market<{ quotes: Record<string, MarketQuote> }>(
      `symbols=${encodeURIComponent(symbols.join(","))}`,
    );
    return quotes;
  },
  chart(symbol: string, range: string) {
    return market<{ quote: MarketQuote | null; points: ChartPoint[] }>(
      `chart=${encodeURIComponent(symbol)}&range=${range}`,
    );
  },
  async search(q: string) {
    const { results } = await market<{ results: SearchHit[] }>(`search=${encodeURIComponent(q)}`);
    return results;
  },
  holdings() {
    return apiRequest<HoldingsResponse>("/markets/holdings", { auth: true });
  },
  orders(symbol?: string) {
    return requestList<Order>(`/markets/orders?limit=20${symbol ? `&symbol=${encodeURIComponent(symbol)}` : ""}`);
  },
  buy(payload: { symbol: string; amount: number; accountType: AccountType }) {
    return apiRequest<{ order: Order; balance: number }>("/markets/buy", { method: "POST", body: payload, auth: true });
  },
  sell(payload: { symbol: string; amount?: number; sellAll?: boolean; accountType: AccountType }) {
    return apiRequest<{ order: Order; balance: number }>("/markets/sell", { method: "POST", body: payload, auth: true });
  },
};

export const marketKeys = {
  quotes: (symbols: string[]) => ["market", "quotes", symbols.join(",")] as const,
  chart: (symbol: string, range: string) => ["market", "chart", symbol, range] as const,
  search: (q: string) => ["market", "search", q] as const,
  holdings: ["market", "holdings"] as const,
  orders: (symbol?: string) => ["market", "orders", symbol ?? "all"] as const,
};
