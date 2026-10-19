/**
 * Live market quotes for stocks, ETFs, mutual funds, crypto and futures.
 * Uses Yahoo Finance's public chart endpoints (no key). Quotes are cached briefly
 * so a burst of orders doesn't hammer the provider.
 */
const CACHE_TTL_MS = 15_000;
const UA = { 'user-agent': 'Mozilla/5.0', accept: 'application/json' };
const TRADABLE_TYPES = ['EQUITY', 'ETF', 'MUTUALFUND', 'CRYPTOCURRENCY', 'FUTURE', 'MONEYMARKET'];

const cache = new Map();

function normalize(meta) {
  if (!meta || !Number.isFinite(meta.regularMarketPrice)) return null;
  const prev = meta.chartPreviousClose ?? meta.previousClose;
  const price = meta.regularMarketPrice;
  return {
    symbol: meta.symbol,
    name: meta.longName || meta.shortName || meta.symbol,
    price,
    change: Number.isFinite(meta.fulldayChange) ? meta.fulldayChange : prev ? price - prev : 0,
    changePercent: Number.isFinite(meta.regularMarketChangePercent)
      ? meta.regularMarketChangePercent
      : prev
        ? ((price - prev) / prev) * 100
        : 0,
    currency: meta.currency || 'USD',
    type: meta.instrumentType,
    exchange: meta.fullExchangeName || meta.exchangeName,
    time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
  };
}

async function getQuotes(symbols) {
  const unique = [...new Set(symbols.map((s) => String(s).toUpperCase()))];
  const result = {};
  const missing = [];
  unique.forEach((s) => {
    const hit = cache.get(s);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) result[s] = hit.quote;
    else missing.push(s);
  });

  for (let i = 0; i < missing.length; i += 20) {
    const chunk = missing.slice(i, i + 20);
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(chunk.join(','))}&range=1d&interval=1d`,
        { headers: UA }
      );
      if (!res.ok) continue;
      const body = await res.json();
      (body?.spark?.result || []).forEach((row) => {
        const quote = normalize(row?.response?.[0]?.meta);
        if (!quote) return;
        const key = String(row.symbol).toUpperCase();
        cache.set(key, { at: Date.now(), quote });
        result[key] = quote;
      });
    } catch (error) {
      console.warn('[market.service] quote refresh failed:', error.message);
    }
  }
  return result;
}

async function getQuote(symbol) {
  const quotes = await getQuotes([symbol]);
  return quotes[String(symbol).toUpperCase()] || null;
}

const isTradable = (quote) => Boolean(quote && TRADABLE_TYPES.includes(quote.type) && quote.currency === 'USD');

module.exports = { getQuotes, getQuote, isTradable, TRADABLE_TYPES };
