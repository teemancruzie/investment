const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const { paginate } = require('../utils/queryFeatures');
const { getOrCreateWallet, applyTransaction } = require('../services/wallet.service');
const { getRates, toUsd, fromUsd } = require('../services/price.service');
const { publicAssets, findAsset, findNetwork, resolveAddress } = require('../config/cryptoAssets');
const { getAddressOverrides } = require('../services/depositAddress.service');
const { notifyUser } = require('../services/notification.service');
const Transaction = require('../models/Transaction');
const { refreshDeposit } = require('../services/chain.service');

const getWallet = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);
  return sendSuccess(res, { message: 'Wallet', data: wallet });
});

/** Supported deposit assets, their networks, deposit addresses and live USD rates. */
const getCryptoAssets = asyncHandler(async (_req, res) => {
  const [assets, rates] = await Promise.all([getAddressOverrides().then(publicAssets), getRates()]);
  return sendSuccess(res, {
    message: 'Supported assets',
    data: { assets, rates, quoteCurrency: 'USD', updatedAt: new Date().toISOString() },
  });
});

/**
 * Investor declares an on-chain transfer. The wallet is only credited once an
 * admin verifies the transaction hash, so the ledger entry starts as pending.
 */
const createCryptoDeposit = asyncHandler(async (req, res) => {
  const { asset: symbol, network: networkId, cryptoAmount, txHash, proofUrl = '' } = req.body;

  const asset = findAsset(symbol);
  if (!asset) throw ApiError.badRequest('Unsupported asset');
  const network = findNetwork(asset, networkId);
  if (!network) throw ApiError.badRequest('Unsupported network for this asset');

  const address = resolveAddress(asset, network, await getAddressOverrides());
  if (!address) throw ApiError.badRequest('This deposit network is currently unavailable. Please choose another.');
  const { rate, usd } = await toUsd(asset.symbol, cryptoAmount);
  if (!usd || usd <= 0) throw ApiError.badRequest('Could not price this deposit, please try again');

  const duplicate = await Transaction.findOne({ 'crypto.txHash': txHash.trim() });
  if (duplicate) throw ApiError.badRequest('This transaction hash has already been submitted');

  const { transaction } = await applyTransaction(req.user._id, {
    type: 'deposit',
    amount: usd,
    status: 'pending',
    method: 'crypto',
    description: `${cryptoAmount} ${asset.symbol} deposit via ${network.label}`,
    crypto: {
      asset: asset.symbol,
      network: network.id,
      address,
      txHash: txHash.trim(),
      cryptoAmount: Number(cryptoAmount),
      rateUsd: rate,
      proofUrl,
      requiredConfirmations: network.confirmations,
      confirmationStatus: 'awaiting',
    },
  });

  // First on-chain lookup right away; failures are non-fatal.
  await refreshDeposit(transaction).catch(() => null);

  await notifyUser(req.user._id, {
    title: 'Deposit submitted',
    message: `We are verifying your ${cryptoAmount} ${asset.symbol} deposit. Funds appear once confirmed on-chain.`,
    type: 'info',
    link: '/wallet',
  });

  return sendSuccess(res, { statusCode: 201, message: 'Deposit submitted for verification', data: transaction });
});

/** The investor's crypto deposits, newest first. Pending ones are re-checked on-chain. */
const listDeposits = asyncHandler(async (req, res) => {
  const { items, meta } = await paginate(Transaction, {
    filter: { user: req.user._id, type: 'deposit', method: 'crypto' },
    page: req.query.page,
    limit: req.query.limit || 10,
    sort: '-createdAt',
  });
  const stale = Date.now() - 30_000;
  await Promise.all(
    items
      .filter((t) => t.status === 'pending' && (!t.crypto?.lastCheckedAt || t.crypto.lastCheckedAt < stale))
      .map((t) => refreshDeposit(t).catch(() => null))
  );
  return sendSuccess(res, { message: 'Deposits', data: items, meta });
});

/** Single deposit with a fresh confirmation count. */
const getDeposit = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id, type: 'deposit' });
  if (!transaction) throw ApiError.notFound('Deposit not found');
  await refreshDeposit(transaction).catch(() => null);
  return sendSuccess(res, { message: 'Deposit', data: transaction });
});

/** Withdrawal to an external crypto address — queued for admin approval. */
const withdraw = asyncHandler(async (req, res) => {
  const { amount, asset: symbol, network: networkId, address } = req.body;

  const asset = findAsset(symbol);
  if (!asset) throw ApiError.badRequest('Unsupported asset');
  const network = findNetwork(asset, networkId);
  if (!network) throw ApiError.badRequest('Unsupported network for this asset');

  const wallet = await getOrCreateWallet(req.user._id);
  if (wallet.frozen) throw ApiError.forbidden('Your account funds are on hold. Please contact support.');
  const pending = await Transaction.aggregate([
    { $match: { user: wallet.user, type: 'withdrawal', status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const reserved = pending[0]?.total ?? 0;
  if (wallet.balance - reserved < Number(amount)) {
    throw ApiError.badRequest('Insufficient available balance (pending withdrawals are reserved)');
  }

  const { rate, amount: cryptoAmount } = await fromUsd(asset.symbol, amount);

  const { transaction } = await applyTransaction(req.user._id, {
    type: 'withdrawal',
    amount: Number(amount),
    status: 'pending',
    method: 'crypto',
    description: `Withdrawal of ~${cryptoAmount} ${asset.symbol} to ${network.label}`,
    crypto: {
      asset: asset.symbol,
      network: network.id,
      address: String(address).trim(),
      cryptoAmount,
      rateUsd: rate,
    },
  });

  return sendSuccess(res, { statusCode: 201, message: 'Withdrawal requested', data: transaction });
});

const listTransactions = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.method) filter.method = req.query.method;
  if (req.query.asset) filter['crypto.asset'] = String(req.query.asset).toUpperCase();

  // Optional inclusive date range on createdAt (?from=YYYY-MM-DD&to=YYYY-MM-DD)
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const range = {};
  if (from && !Number.isNaN(from.getTime())) range.$gte = from;
  if (to && !Number.isNaN(to.getTime())) {
    to.setHours(23, 59, 59, 999);
    range.$lte = to;
  }
  if (Object.keys(range).length) filter.createdAt = range;
  const { items, meta } = await paginate(Transaction, {
    filter,
    page: req.query.page,
    limit: req.query.limit,
    sort: '-createdAt',
  });
  return sendSuccess(res, { message: 'Transactions', data: items, meta });
});

module.exports = {
  getWallet,
  getCryptoAssets,
  createCryptoDeposit,
  listDeposits,
  getDeposit,
  withdraw,
  listTransactions,
};
