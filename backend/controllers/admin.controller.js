const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { paginate } = require('../utils/queryFeatures');
const { settleTransaction } = require('../services/wallet.service');
const { notifyUser } = require('../services/notification.service');
const { runPayouts } = require('../services/payout.service');
const { formatCurrency } = require('../utils/format');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const ApiError = require('../utils/ApiError');

/** Every deposit/withdrawal request across the platform, newest first. */
const listRequests = asyncHandler(async (req, res) => {
  const filter = { type: { $in: ['deposit', 'withdrawal'] } };
  if (req.query.type) filter.type = req.query.type;
  filter.status = req.query.status || 'pending';
  if (req.query.asset) filter['crypto.asset'] = String(req.query.asset).toUpperCase();

  const { items, meta } = await paginate(Transaction, {
    filter,
    page: req.query.page,
    limit: req.query.limit,
    sort: '-createdAt',
    populate: { path: 'user', select: 'firstName lastName email avatar' },
  });

  return sendSuccess(res, { message: 'Funding requests', data: items, meta });
});

/** Pending counts, useful for the admin sidebar badges. */
const requestSummary = asyncHandler(async (_req, res) => {
  const rows = await Transaction.aggregate([
    { $match: { status: 'pending', type: { $in: ['deposit', 'withdrawal'] } } },
    { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } },
  ]);
  const summary = { deposits: 0, depositValue: 0, withdrawals: 0, withdrawalValue: 0 };
  rows.forEach((row) => {
    if (row._id === 'deposit') {
      summary.deposits = row.count;
      summary.depositValue = row.total;
    } else {
      summary.withdrawals = row.count;
      summary.withdrawalValue = row.total;
    }
  });
  return sendSuccess(res, { message: 'Pending requests', data: summary });
});

const reviewRequest = asyncHandler(async (req, res) => {
  const approve = req.body.action === 'approve';
  const { transaction } = await settleTransaction(req.params.id, {
    approve,
    adminId: req.user._id,
    adminNote: req.body.note || '',
    amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
  });

  const label = transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal';
  await notifyUser(transaction.user, {
    title: `${label} ${approve ? 'confirmed' : 'declined'}`,
    message: approve
      ? `Your ${label.toLowerCase()} of ${formatCurrency(transaction.amount)} has been processed.`
      : `Your ${label.toLowerCase()} of ${formatCurrency(transaction.amount)} was declined. ${req.body.note || ''}`.trim(),
    type: approve ? 'success' : 'warning',
    link: '/wallet',
  });

  return sendSuccess(res, {
    message: approve ? `${label} approved` : `${label} declined`,
    data: transaction,
  });
});

/** Preview the accrual/maturity sweep without touching balances. */
const previewPayouts = asyncHandler(async (_req, res) => {
  const result = await runPayouts({ dryRun: true });
  return sendSuccess(res, { message: 'Payout preview', data: result });
});

/** Manually trigger the accrual/maturity sweep (the job also runs on a timer). */
const executePayouts = asyncHandler(async (_req, res) => {
  const result = await runPayouts();
  return sendSuccess(res, { message: 'Payout run complete', data: result });
});

/**
 * Withdrawal queue with each investor's current wallet balance and the total
 * of their other pending withdrawals, so reviewers can spot shortfalls.
 */
const listWithdrawals = asyncHandler(async (req, res) => {
  const filter = { type: 'withdrawal', status: req.query.status || 'pending' };
  if (req.query.asset) filter['crypto.asset'] = String(req.query.asset).toUpperCase();

  const { items, meta } = await paginate(Transaction, {
    filter,
    page: req.query.page,
    limit: req.query.limit,
    sort: filter.status === 'pending' ? 'createdAt' : '-reviewedAt',
    populate: [
      { path: 'user', select: 'firstName lastName email avatar' },
      { path: 'reviewedBy', select: 'firstName lastName' },
    ],
  });

  const userIds = [...new Set(items.map((t) => String(t.user?._id || t.user)))];
  const [wallets, reserved] = await Promise.all([
    Wallet.find({ user: { $in: userIds } }).lean(),
    Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'pending', user: { $in: items.map((t) => t.user?._id || t.user) } } },
      { $group: { _id: '$user', total: { $sum: '$amount' } } },
    ]),
  ]);
  const balanceOf = Object.fromEntries(wallets.map((w) => [String(w.user), w.balance]));
  const reservedOf = Object.fromEntries(reserved.map((r) => [String(r._id), r.total]));

  const data = items.map((t) => {
    const obj = typeof t.toJSON === 'function' ? t.toJSON() : t;
    const uid = String(t.user?._id || t.user);
    return { ...obj, walletBalance: balanceOf[uid] ?? 0, pendingTotal: reservedOf[uid] ?? 0 };
  });

  return sendSuccess(res, { message: 'Withdrawal requests', data, meta });
});

/** Approve (debit wallet, optionally record the payout tx hash) or decline with a required note. */
const reviewWithdrawal = asyncHandler(async (req, res) => {
  const existing = await Transaction.findById(req.params.id).select('type');
  if (!existing) throw ApiError.notFound('Withdrawal not found');
  if (existing.type !== 'withdrawal') throw ApiError.badRequest('This request is not a withdrawal');

  const approve = req.body.action === 'approve';
  const note = String(req.body.note || '').trim();
  const { transaction } = await settleTransaction(req.params.id, {
    approve,
    adminId: req.user._id,
    adminNote: note,
  });

  if (approve && req.body.payoutTxHash && transaction.crypto) {
    transaction.crypto.payoutTxHash = String(req.body.payoutTxHash).trim();
    await transaction.save();
  }

  await notifyUser(transaction.user, {
    title: `Withdrawal ${approve ? 'sent' : 'declined'}`,
    message: approve
      ? `Your withdrawal of ${formatCurrency(transaction.amount)} has been approved and sent.${note ? ` Note: ${note}` : ''}`
      : `Your withdrawal of ${formatCurrency(transaction.amount)} was declined. Reason: ${note}`,
    type: approve ? 'success' : 'warning',
    link: '/wallet',
  });

  return sendSuccess(res, { message: approve ? 'Withdrawal approved' : 'Withdrawal declined', data: transaction });
});

module.exports = { listWithdrawals, reviewWithdrawal, listRequests, requestSummary, reviewRequest, previewPayouts, executePayouts };


/** Admin: force an on-chain confirmation re-check for a pending deposit. */
const refreshDepositConfirmations = asyncHandler(async (req, res) => {
  const Transaction = require('../models/Transaction');
  const { refreshDeposit } = require('../services/chain.service');
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction || transaction.type !== 'deposit') throw ApiError.notFound('Deposit not found');
  await refreshDeposit(transaction);
  return sendSuccess(res, { message: 'Confirmations refreshed', data: transaction });
});

module.exports.refreshDepositConfirmations = refreshDepositConfirmations;

/* ---------------- Investor funds: credit, debit, hold ---------------- */
const User = require('../models/User');
const { getOrCreateWallet, applyTransaction } = require('../services/wallet.service');
const { ASSETS, publicAssets, findAsset, findNetwork } = require('../config/cryptoAssets');
const { getAddressOverrides, setAddressOverride } = require('../services/depositAddress.service');

const getUserWallet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('firstName lastName email');
  if (!user) throw ApiError.notFound('Investor not found');
  const wallet = await getOrCreateWallet(user._id);
  const recent = await Transaction.find({ user: user._id }).sort('-createdAt').limit(10).lean();
  return sendSuccess(res, { message: 'Investor wallet', data: { user, wallet, recent } });
});

/** Add funds to (credit) or withdraw funds from (debit) an investor's wallet. */
const adjustUserWallet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('_id');
  if (!user) throw ApiError.notFound('Investor not found');
  const credit = req.body.action === 'credit';
  const amount = Number(req.body.amount);
  const note = String(req.body.note || '').trim();
  const { wallet, transaction } = await applyTransaction(user._id, {
    type: credit ? 'deposit' : 'withdrawal',
    amount,
    method: 'manual',
    bypassFreeze: true,
    description: `${credit ? 'Funds added' : 'Funds withdrawn'} by administrator${note ? ` — ${note}` : ''}`,
  });
  transaction.adminNote = note;
  transaction.reviewedBy = req.user._id;
  transaction.reviewedAt = new Date();
  await transaction.save();
  await notifyUser(user._id, {
    title: credit ? 'Funds added to your wallet' : 'Funds withdrawn from your wallet',
    message: `${formatCurrency(amount)} was ${credit ? 'added to' : 'withdrawn from'} your wallet by our team.${note ? ` Note: ${note}` : ''}`,
    type: credit ? 'success' : 'warning',
    link: '/wallet',
  });
  return sendSuccess(res, { message: credit ? 'Funds added' : 'Funds withdrawn', data: { wallet, transaction } });
});

/** Put an investor's funds on hold (protect) or release them. */
const setWalletHold = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.params.id);
  const frozen = Boolean(req.body.frozen);
  wallet.frozen = frozen;
  wallet.frozenReason = frozen ? String(req.body.reason || '').trim() : '';
  wallet.frozenAt = frozen ? new Date() : undefined;
  await wallet.save();
  await notifyUser(req.params.id, {
    title: frozen ? 'Your funds are on hold' : 'Your funds are released',
    message: frozen
      ? `For your protection, withdrawals and investing are paused.${wallet.frozenReason ? ` Reason: ${wallet.frozenReason}` : ''}`
      : 'You can withdraw and invest again.',
    type: frozen ? 'security' : 'success',
    link: '/wallet',
  });
  return sendSuccess(res, { message: frozen ? 'Funds protected' : 'Funds released', data: wallet });
});

/* ---------------- Deposit wallet addresses ---------------- */
const listDepositAddresses = asyncHandler(async (_req, res) => {
  const overrides = await getAddressOverrides();
  const data = publicAssets(overrides).map((a) => ({
    ...a,
    networks: a.networks.map((n) => {
      const src = ASSETS.find((x) => x.symbol === a.symbol).networks.find((x) => x.id === n.id);
      const o = overrides[`${a.symbol}:${n.id}`] || {};
      return { ...n, address: o.address || process.env[src.envKey] || '', updatedAt: o.updatedAt || null };
    }),
  }));
  return sendSuccess(res, { message: 'Deposit addresses', data });
});

const updateDepositAddress = asyncHandler(async (req, res) => {
  const asset = findAsset(req.body.asset);
  const network = findNetwork(asset, req.body.network);
  if (!asset || !network) throw ApiError.badRequest('Unsupported asset or network');
  await setAddressOverride(asset.symbol, network.id, { address: req.body.address, enabled: req.body.enabled });
  return sendSuccess(res, { message: 'Deposit wallet updated' });
});

Object.assign(module.exports, { getUserWallet, adjustUserWallet, setWalletHold, listDepositAddresses, updateDepositAddress });
