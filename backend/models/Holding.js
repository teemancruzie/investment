const mongoose = require('mongoose');

const ACCOUNT_TYPES = ['individual', 'traditional_ira', 'roth_ira', 'sep_ira', 'solo_401k', 'rollover_401k'];

/** A fractional position in a listed asset, held inside one account type. */
const holdingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, default: '' },
    assetType: { type: String, default: '' },
    accountType: { type: String, enum: ACCOUNT_TYPES, default: 'individual' },
    quantity: { type: Number, required: true, min: 0 },
    averageCost: { type: Number, required: true, min: 0 },
    realizedPnl: { type: Number, default: 0 },
  },
  { timestamps: true }
);

holdingSchema.index({ user: 1, symbol: 1, accountType: 1 }, { unique: true });

module.exports = mongoose.model('Holding', holdingSchema);
module.exports.ACCOUNT_TYPES = ACCOUNT_TYPES;
