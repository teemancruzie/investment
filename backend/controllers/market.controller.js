const Holding = require('../models/Holding');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const { paginate } = require('../utils/queryFeatures');
const { applyTransaction } = require('../services/wallet.service');
const { getQuote, getQuotes, isTradable } = require('../services/market.service');
const { notifyUser } = require('../services/notification.service');

const { ACCOUNT_TYPES } = Holding;
const MIN_ORDER = 1;
const round = (n, d = 8) => Number(Number(n).toFixed(d));

function readOrder(body) {
  const symbol = String(body.symbol || '').trim().toUpperCase();
  const accountType = body.accountType || 'individual';
  if (!/^[A-Z0-9.\-=^]{1,15}$/.test(symbol)) throw ApiError.badRequest('A valid symbol is required');
  if (!ACCOUNT_TYPES.includes(accountType)) throw ApiError.badRequest('Unknown account type');
  return { symbol, accountType };
}

async function liveQuote(symbol) {
  const quote = await getQuote(symbol);
  if (!quote) throw ApiError.badRequest('Live price is unavailable for this symbol right now');
  if (!isTradable(quote)) throw ApiError.badRequest('This asset cannot be traded on the platform');
  return quote;
}

/** GET /markets/quotes?symbols=AAPL,BTC-USD */
const quotes = asyncHandler(async (req, res) => {
  const symbols = String(req.query.symbols || '').split(',').filter(Boolean).slice(0, 100);
  return sendSuccess(res, { message: 'Quotes', data: await getQuotes(symbols) });
});

/** GET /markets/holdings — positions valued at live prices. */
const holdings = asyncHandler(async (req, res) => {
  const rows = await Holding.find({ user: req.user._id, quantity: { $gt: 0 } }).lean();
  const prices = await getQuotes(rows.map((r) => r.symbol));
  const items = rows.map((r) => {
    const quote = prices[r.symbol];
    const price = quote?.price ?? r.averageCost;
    const marketValue = round(r.quantity * price, 2);
    const costBasis = round(r.quantity * r.averageCost, 2);
    return {
      ...r,
      id: r._id,
      price,
      changePercent: quote?.changePercent ?? 0,
      marketValue,
      costBasis,
      unrealizedPnl: round(marketValue - costBasis, 2),
      unrealizedPct: costBasis ? round(((marketValue - costBasis) / costBasis) * 100, 2) : 0,
    };
  });
  const totals = items.reduce(
    (acc, h) => ({
      marketValue: acc.marketValue + h.marketValue,
      costBasis: acc.costBasis + h.costBasis,
      realizedPnl: acc.realizedPnl + (h.realizedPnl || 0),
    }),
    { marketValue: 0, costBasis: 0, realizedPnl: 0 }
  );
  totals.unrealizedPnl = round(totals.marketValue - totals.costBasis, 2);
  return sendSuccess(res, { message: 'Holdings', data: { items, totals } });
});

/** GET /markets/orders */
const orders = asyncHandler(async (req, res) => {
  const { items, meta } = await paginate(Order, {
    filter: { user: req.user._id, ...(req.query.symbol ? { symbol: String(req.query.symbol).toUpperCase() } : {}) },
    page: req.query.page,
    limit: req.query.limit,
    sort: '-createdAt',
  });
  return sendSuccess(res, { message: 'Orders', data: items, meta });
});

/** POST /markets/buy { symbol, amount (USD), accountType } — fractional market buy. */
const buy = asyncHandler(async (req, res) => {
  const { symbol, accountType } = readOrder(req.body);
  const amount = round(req.body.amount, 2);
  if (!Number.isFinite(amount) || amount < MIN_ORDER) throw ApiError.badRequest(`Minimum order is $${MIN_ORDER}`);

  const quote = await liveQuote(symbol);
  const quantity = round(amount / quote.price);

  const { transaction, wallet } = await applyTransaction(req.user._id, {
    type: 'purchase',
    amount,
    description: `Bought ${quantity} ${symbol} @ $${quote.price}`,
  });

  const holding = await Holding.findOne({ user: req.user._id, symbol, accountType });
  if (holding) {
    const newQty = holding.quantity + quantity;
    holding.averageCost = round((holding.averageCost * holding.quantity + amount) / newQty, 6);
    holding.quantity = round(newQty);
    await holding.save();
  } else {
    await Holding.create({
      user: req.user._id,
      symbol,
      name: quote.name,
      assetType: quote.type,
      accountType,
      quantity,
      averageCost: round(amount / quantity, 6),
    });
  }

  const order = await Order.create({
    user: req.user._id,
    side: 'buy',
    symbol,
    name: quote.name,
    assetType: quote.type,
    accountType,
    quantity,
    price: quote.price,
    amount,
    transaction: transaction._id,
  });

  await notifyUser(req.user._id, {
    title: 'Order filled',
    message: `Bought ${quantity} ${symbol} for $${amount}.`,
    type: 'success',
  });

  return sendSuccess(res, { statusCode: 201, message: 'Order filled', data: { order, balance: wallet.balance } });
});

/** POST /markets/sell { symbol, amount? (USD) | sellAll, accountType } */
const sell = asyncHandler(async (req, res) => {
  const { symbol, accountType } = readOrder(req.body);
  const holding = await Holding.findOne({ user: req.user._id, symbol, accountType });
  if (!holding || holding.quantity <= 0) throw ApiError.badRequest('You do not hold this asset in that account');

  const quote = await liveQuote(symbol);
  let quantity;
  if (req.body.sellAll) quantity = holding.quantity;
  else {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < MIN_ORDER) throw ApiError.badRequest(`Minimum order is $${MIN_ORDER}`);
    quantity = Math.min(holding.quantity, round(amount / quote.price));
  }
  const proceeds = round(quantity * quote.price, 2);
  const realizedPnl = round(proceeds - quantity * holding.averageCost, 2);

  const { transaction, wallet } = await applyTransaction(req.user._id, {
    type: 'sale',
    amount: proceeds,
    description: `Sold ${quantity} ${symbol} @ $${quote.price}`,
  });

  holding.quantity = round(holding.quantity - quantity);
  holding.realizedPnl = round((holding.realizedPnl || 0) + realizedPnl, 2);
  if (holding.quantity < 1e-8) holding.quantity = 0;
  await holding.save();

  const order = await Order.create({
    user: req.user._id,
    side: 'sell',
    symbol,
    name: holding.name,
    assetType: holding.assetType,
    accountType,
    quantity,
    price: quote.price,
    amount: proceeds,
    realizedPnl,
    transaction: transaction._id,
  });

  return sendSuccess(res, { statusCode: 201, message: 'Order filled', data: { order, balance: wallet.balance } });
});

module.exports = { quotes, holdings, orders, buy, sell };
