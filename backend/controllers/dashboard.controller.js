const mongoose = require('mongoose');
const UserInvestment = require('../models/UserInvestment');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { getOrCreateWallet } = require('../services/wallet.service');

/** Aggregated stats + chart series for the signed-in investor. */
const getDashboard = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const wallet = await getOrCreateWallet(userId);

  const [totals] = await UserInvestment.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalInvested: { $sum: '$amount' },
        totalReturns: { $sum: '$earnedReturn' },
        expectedReturns: { $sum: '$expectedReturn' },
        activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      },
    },
  ]);

  const pendingTransactions = await Transaction.countDocuments({ user: userId, status: 'pending' });
  const unreadNotifications = await Notification.countDocuments({
    $or: [{ user: userId, isRead: false }, { isBroadcast: true, readBy: { $ne: userId } }],
  });

  const monthly = await Transaction.aggregate([
    { $match: { user: userId, status: 'completed' } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        invested: { $sum: { $cond: [{ $eq: ['$type', 'investment'] }, '$amount', 0] } },
        returns: { $sum: { $cond: [{ $eq: ['$type', 'return'] }, '$amount', 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ]);

  const allocation = await UserInvestment.aggregate([
    { $match: { user: userId, status: 'active' } },
    { $lookup: { from: 'investments', localField: 'investment', foreignField: '_id', as: 'inv' } },
    { $unwind: '$inv' },
    { $lookup: { from: 'categories', localField: 'inv.category', foreignField: '_id', as: 'cat' } },
    { $unwind: '$cat' },
    { $group: { _id: '$cat.name', value: { $sum: '$amount' } } },
    { $sort: { value: -1 } },
  ]);

  const recentInvestments = await UserInvestment.find({ user: userId })
    .sort('-createdAt')
    .limit(5)
    .populate('investment', 'title image expectedAnnualReturn')
    .lean();

  const recentTransactions = await Transaction.find({ user: userId }).sort('-createdAt').limit(5).lean();

  const totalInvested = totals?.totalInvested || 0;
  const totalReturns = totals?.totalReturns || 0;

  return sendSuccess(res, {
    message: 'Dashboard',
    data: {
      stats: {
        portfolioValue: Number((totalInvested + totalReturns).toFixed(2)),
        totalInvested,
        totalReturns,
        expectedReturns: totals?.expectedReturns || 0,
        activeInvestments: totals?.activeCount || 0,
        walletBalance: wallet.balance,
        pendingTransactions,
        unreadNotifications,
      },
      charts: {
        monthly: monthly.map((m) => ({
          label: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          invested: m.invested,
          returns: m.returns,
        })),
        allocation: allocation.map((a) => ({ label: a._id, value: a.value })),
      },
      recentInvestments,
      recentTransactions,
    },
  });
});

module.exports = { getDashboard };
