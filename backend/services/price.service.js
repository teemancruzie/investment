const { ASSETS, findAsset } = require('../config/cryptoAssets');

const CACHE_TTL_MS = 60_000;
const FALLBACK = { BTC: 65000, ETH: 3200, BNB: 580, TRX: 0.12, SOL: 150, USDT: 1, USDC: 1 };

let cache = { at: 0, rates: null };

/**
 * USD spot prices for every supported asset.
 * Stablecoins are pinned at 1. Live prices come from CoinGecko's public API and
 * are cached for a minute; if the call fails we fall back to indicative rates so
 * the deposit flow never blocks on a third-party outage.
 */
async function getRates() {
  if (cache.rates && Date.now() - cache.at < CACHE_TTL_MS) return cache.rates;

  const ids = ASSETS.filter((a) => !a.stable).map((a) => a.coingeckoId).join(',');
  const rates = { ...FALLBACK };

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { headers: { accept: 'application/json' } }
    );
    if (res.ok) {
      const body = await res.json();
      ASSETS.forEach((asset) => {
        if (asset.stable) {
          rates[asset.symbol] = 1;
          return;
        }
        const price = body?.[asset.coingeckoId]?.usd;
        if (Number.isFinite(price) && price > 0) rates[asset.symbol] = price;
      });
    }
  } catch (error) {
    // Keep fallback rates; log once per refresh window.
    console.warn('[price.service] rate refresh failed:', error.message);
  }

  cache = { at: Date.now(), rates };
  return rates;
}

/** USD price of a single unit of `symbol`. */
async function getRate(symbol) {
  const asset = findAsset(symbol);
  if (!asset) return 0;
  if (asset.stable) return 1;
  const rates = await getRates();
  return rates[asset.symbol] || 0;
}

/** Converts a crypto amount into USD using the current rate. */
async function toUsd(symbol, cryptoAmount) {
  const rate = await getRate(symbol);
  return { rate, usd: Number((Number(cryptoAmount || 0) * rate).toFixed(2)) };
}

/** Converts a USD amount into crypto units using the current rate. */
async function fromUsd(symbol, usdAmount) {
  const asset = findAsset(symbol);
  const rate = await getRate(symbol);
  if (!rate) return { rate: 0, amount: 0 };
  return { rate, amount: Number((Number(usdAmount || 0) / rate).toFixed(asset?.decimals ?? 8)) };
}

module.exports = { getRates, getRate, toUsd, fromUsd };
