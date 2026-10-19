const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    lockedBalance: { type: Number, default: 0, min: 0 },
    // Admin-applied protection: blocks withdrawals, investing and trading.
    frozen: { type: Boolean, default: false },
    frozenReason: { type: String, default: '' },
    frozenAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
