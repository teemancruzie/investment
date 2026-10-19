const mongoose = require('mongoose');
const { ACCOUNT_TYPES } = require('./Holding');

/** A filled market order (buy or sell) at the live price at execution time. */
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    symbol: { type: String, required: true, uppercase: true },
    name: { type: String, default: '' },
    assetType: { type: String, default: '' },
    accountType: { type: String, enum: ACCOUNT_TYPES, default: 'individual' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    realizedPnl: { type: Number, default: 0 },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
