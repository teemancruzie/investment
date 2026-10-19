/**
 * Supported crypto deposit assets.
 *
 * The ledger itself is denominated in USD: a deposit is converted at the rate
 * captured when the admin approves the proof of payment. Deposit addresses are
 * read from environment variables so no wallet address is hardcoded in source.
 */

const ASSETS = [
  {
    symbol: 'USDT',
    name: 'Tether',
    stable: true,
    coingeckoId: 'tether',
    decimals: 2,
    networks: [
      { id: 'trc20', label: 'Tron (TRC-20)', envKey: 'DEPOSIT_ADDRESS_USDT_TRC20', confirmations: 20 },
      { id: 'erc20', label: 'Ethereum (ERC-20)', envKey: 'DEPOSIT_ADDRESS_USDT_ERC20', confirmations: 12 },
      { id: 'bep20', label: 'BNB Smart Chain (BEP-20)', envKey: 'DEPOSIT_ADDRESS_USDT_BEP20', confirmations: 15 },
    ],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    stable: true,
    coingeckoId: 'usd-coin',
    decimals: 2,
    networks: [
      { id: 'erc20', label: 'Ethereum (ERC-20)', envKey: 'DEPOSIT_ADDRESS_USDC_ERC20', confirmations: 12 },
      { id: 'sol', label: 'Solana (SPL)', envKey: 'DEPOSIT_ADDRESS_USDC_SOL', confirmations: 32 },
      { id: 'bep20', label: 'BNB Smart Chain (BEP-20)', envKey: 'DEPOSIT_ADDRESS_USDC_BEP20', confirmations: 15 },
    ],
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    stable: false,
    coingeckoId: 'bitcoin',
    decimals: 8,
    networks: [{ id: 'bitcoin', label: 'Bitcoin', envKey: 'DEPOSIT_ADDRESS_BTC', confirmations: 2 }],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    stable: false,
    coingeckoId: 'ethereum',
    decimals: 6,
    networks: [{ id: 'erc20', label: 'Ethereum (ERC-20)', envKey: 'DEPOSIT_ADDRESS_ETH', confirmations: 12 }],
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    stable: false,
    coingeckoId: 'binancecoin',
    decimals: 6,
    networks: [{ id: 'bep20', label: 'BNB Smart Chain (BEP-20)', envKey: 'DEPOSIT_ADDRESS_BNB', confirmations: 15 }],
  },
  {
    symbol: 'TRX',
    name: 'Tron',
    stable: false,
    coingeckoId: 'tron',
    decimals: 4,
    networks: [{ id: 'trc20', label: 'Tron (TRC-20)', envKey: 'DEPOSIT_ADDRESS_TRX', confirmations: 20 }],
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    stable: false,
    coingeckoId: 'solana',
    decimals: 6,
    networks: [{ id: 'sol', label: 'Solana', envKey: 'DEPOSIT_ADDRESS_SOL', confirmations: 32 }],
  },
];

const SYMBOLS = ASSETS.map((a) => a.symbol);

const findAsset = (symbol) => ASSETS.find((a) => a.symbol === String(symbol || '').toUpperCase());

const findNetwork = (asset, networkId) =>
  asset ? asset.networks.find((n) => n.id === String(networkId || '').toLowerCase()) : undefined;

/**
 * Admin-set address (stored in the Setting collection) wins over the env var.
 * A disabled network resolves to an empty address so no deposits go there.
 */
function resolveAddress(asset, network, overrides = {}) {
  const o = overrides[`${asset.symbol}:${network.id}`];
  if (o && o.enabled === false) return '';
  return (o && o.address) || process.env[network.envKey] || '';
}

/** Asset catalogue with resolved deposit addresses (empty string when unset). */
function publicAssets(overrides = {}) {
  return ASSETS.map((asset) => ({
    symbol: asset.symbol,
    name: asset.name,
    stable: asset.stable,
    decimals: asset.decimals,
    networks: asset.networks.map((network) => ({
      id: network.id,
      label: network.label,
      confirmations: network.confirmations,
      address: resolveAddress(asset, network, overrides),
      enabled: overrides[`${asset.symbol}:${network.id}`]?.enabled !== false,
    })),
  }));
}

module.exports = { ASSETS, SYMBOLS, findAsset, findNetwork, publicAssets, resolveAddress };
