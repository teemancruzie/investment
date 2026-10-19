const mongoose = require('mongoose');

const userInvestmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    investment: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    units: { type: Number, required: true, min: 1 },
    expectedReturn: { type: Number, default: 0 },
    earnedReturn: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active', index: true },
    maturityDate: { type: Date },
  },
  { timestamps: true }
);

userInvestmentSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('UserInvestment', userInvestmentSchema);
