import type { ChartPoint, MarketQuote, SearchHit } from "./types";

const HEADERS = { "user-agent": "Mozilla/5.0", accept: "application/json" };

type YahooMeta = Record<string, unknown> & { symbol: string; regularMarketPrice?: number };

function toQuote(meta: YahooMeta | undefined): MarketQuote | null {
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;
  const num = (k: string) => (typeof meta[k] === "number" ? (meta[k] as number) : null);
  const price = meta.regularMarketPrice;
  const prev = num("chartPreviousClose") ?? num("previousClose");
  return {
    symbol: meta.symbol,
    name: String(meta["longName"] ?? meta["shortName"] ?? meta.symbol),
    price,
    change: num("fulldayChange") ?? (prev ? price - prev : 0),
    changePercent: num("regularMarketChangePercent") ?? (prev ? ((price - prev) / prev) * 100 : 0),
    currency: String(meta["currency"] ?? "USD"),
    type: String(meta["instrumentType"] ?? ""),
    exchange: String(meta["fullExchangeName"] ?? meta["exchangeName"] ?? ""),
    dayHigh: num("regularMarketDayHigh"),
    dayLow: num("regularMarketDayLow"),
    yearHigh: num("fiftyTwoWeekHigh"),
    yearLow: num("fiftyTwoWeekLow"),
    volume: num("regularMarketVolume"),
    time: num("regularMarketTime") ? new Date((num("regularMarketTime") as number) * 1000).toISOString() : null,
  };
}

export async function fetchQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))].slice(0, 120);
  const out: Record<string, MarketQuote> = {};
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 20) chunks.push(unique.slice(i, i + 20));
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(chunk.join(","))}&range=1d&interval=1d`,
          { headers: HEADERS },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { spark?: { result?: { symbol: string; response?: { meta?: YahooMeta }[] }[] } };
        for (const row of body.spark?.result ?? []) {
          const q = toQuote(row.response?.[0]?.meta);
          if (q) out[row.symbol.toUpperCase()] = q;
        }
      } catch (error) {
        console.error("quote fetch failed", error);
      }
    }),
  );
  return out;
}

const RANGES: Record<string, string> = { "1d": "5m", "5d": "30m", "1mo": "1d", "6mo": "1d", "1y": "1d", "5y": "1wk" };

export async function fetchChart(symbol: string, range: string) {
  const r = RANGES[range] ? range : "1mo";
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r}&interval=${RANGES[r]}`,
    { headers: HEADERS },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as {
    chart?: { result?: { meta: YahooMeta; timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] };
  };
  const result = body.chart?.result?.[0];
  if (!result) return null;
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: ChartPoint[] = (result.timestamp ?? [])
    .map((t, i) => ({ t: t * 1000, price: closes[i] ?? null }))
    .filter((p): p is ChartPoint => typeof p.price === "number");
  return { quote: toQuote(result.meta), points };
}

const SEARCH_TYPES = new Set(["EQUITY", "ETF", "MUTUALFUND", "CRYPTOCURRENCY", "FUTURE", "MONEYMARKET"]);

export async function searchSymbols(q: string): Promise<SearchHit[]> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`,
    { headers: HEADERS },
  );
  if (!res.ok) return [];
  const body = (await res.json()) as {
    quotes?: { symbol: string; shortname?: string; longname?: string; quoteType?: string; exchDisp?: string; typeDisp?: string }[];
  };
  return (body.quotes ?? [])
    .filter((x) => x.symbol && SEARCH_TYPES.has(String(x.quoteType)) && !x.symbol.includes("."))
    .map((x) => ({
      symbol: x.symbol,
      name: x.longname ?? x.shortname ?? x.symbol,
      type: x.typeDisp ?? x.quoteType ?? "",
      exchange: x.exchDisp ?? "",
    }));
}
