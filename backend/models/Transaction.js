const mongoose = require('mongoose');
const { SYMBOLS } = require('../config/cryptoAssets');

/**
 * Crypto leg of a transaction. Present on crypto deposits and withdrawals; the
 * ledger amount itself is always the USD equivalent captured at review time.
 */
const cryptoSchema = new mongoose.Schema(
  {
    asset: { type: String, enum: SYMBOLS },
    network: { type: String },
    address: { type: String, default: '' },
    txHash: { type: String, default: '' },
    cryptoAmount: { type: Number, default: 0 },
    rateUsd: { type: Number, default: 0 },
    proofUrl: { type: String, default: '' },
    payoutTxHash: { type: String, default: '' },
    confirmations: { type: Number, default: 0 },
    requiredConfirmations: { type: Number, default: 1 },
    confirmationStatus: {
      type: String,
      enum: ['awaiting', 'confirming', 'confirmed', 'failed'],
      default: 'awaiting',
    },
    lastCheckedAt: { type: Date },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    investment: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'investment', 'return', 'fee', 'purchase', 'sale'],
      required: true,
      index: true,
    },
    method: { type: String, enum: ['crypto', 'manual', 'internal'], default: 'internal', index: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'rejected'],
      default: 'completed',
      index: true,
    },
    crypto: { type: cryptoSchema, default: undefined },
    reference: { type: String, index: true },
    description: { type: String, default: '' },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
