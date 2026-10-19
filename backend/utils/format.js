/** Server-side display helpers for emails and notifications. */

function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatCrypto(value, symbol, decimals = 8) {
  const amount = Number(value || 0).toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
  return `${amount} ${symbol}`;
}

module.exports = { formatCurrency, formatCrypto };
