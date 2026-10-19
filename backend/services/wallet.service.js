const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
  return wallet;
}

const CREDIT_TYPES = ['deposit', 'return', 'sale'];

/** Applies a signed amount to the wallet and records a transaction atomically enough for a single node. */
async function applyTransaction(
  userId,
  { type, amount, investment, description = '', status = 'completed', method = 'internal', crypto, bypassFreeze = false }
) {
  const wallet = await getOrCreateWallet(userId);
  const signed = CREDIT_TYPES.includes(type) ? Math.abs(amount) : -Math.abs(amount);
  if (signed < 0 && wallet.frozen && !bypassFreeze) {
    throw ApiError.forbidden('Your account funds are on hold. Please contact support.');
  }

  if (status === 'completed') {
    if (wallet.balance + signed < 0) throw ApiError.badRequest('Insufficient wallet balance');
    wallet.balance += signed;
    await wallet.save();
  }

  const transaction = await Transaction.create({
    user: userId,
    investment,
    type,
    method,
    amount: Math.abs(amount),
    balanceAfter: wallet.balance,
    status,
    description,
    ...(crypto ? { crypto } : {}),
    reference: `TX-${Date.now().toString(36).toUpperCase()}`,
  });

  return { wallet, transaction };
}

/**
 * Settles a pending deposit/withdrawal after an admin review.
 * Approving a deposit credits the wallet; approving a withdrawal debits it.
 * The USD amount may be corrected on approval (e.g. the received crypto amount
 * differed from what the investor declared).
 */
async function settleTransaction(transactionId, { approve, adminId, adminNote = '', amount }) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw ApiError.notFound('Transaction not found');
  if (transaction.status !== 'pending') throw ApiError.badRequest('This request has already been reviewed');

  const wallet = await getOrCreateWallet(transaction.user);

  if (approve) {
    if (Number.isFinite(amount) && amount > 0) transaction.amount = Number(amount);
    const signed = CREDIT_TYPES.includes(transaction.type)
      ? Math.abs(transaction.amount)
      : -Math.abs(transaction.amount);

    if (wallet.balance + signed < 0) throw ApiError.badRequest('Investor balance is no longer sufficient');
    wallet.balance += signed;
    await wallet.save();

    transaction.status = 'completed';
    transaction.balanceAfter = wallet.balance;
  } else {
    transaction.status = 'rejected';
    transaction.balanceAfter = wallet.balance;
  }

  transaction.adminNote = adminNote;
  transaction.reviewedBy = adminId;
  transaction.reviewedAt = new Date();
  await transaction.save();

  return { wallet, transaction };
}

module.exports = { getOrCreateWallet, applyTransaction, settleTransaction };
