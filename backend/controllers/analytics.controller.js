const User = require('../models/User');
const Investment = require('../models/Investment');
const UserInvestment = require('../models/UserInvestment');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

/** Admin overview: headline stats, growth series, category split, recent activity. */
const getOverview = asyncHandler(async (_req, res) => {
  const since = monthsAgo(11);

  const [users, activeInvestors, investments, activeInvestments] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    UserInvestment.distinct('user', { status: 'active' }),
    Investment.countDocuments(),
    Investment.countDocuments({ status: 'active' }),
  ]);

  const [money] = await UserInvestment.aggregate([
    { $group: { _id: null, totalInvested: { $sum: '$amount' }, totalReturns: { $sum: '$earnedReturn' } } },
  ]);

  const [revenue] = await Transaction.aggregate([
    { $match: { type: 'fee', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const newUsersByMonth = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  const investedByMonth = await UserInvestment.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, total: { $sum: '$amount' } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  const byCategory = await Investment.aggregate([
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
    { $unwind: '$cat' },
    { $group: { _id: '$cat.name', count: { $sum: 1 }, funded: { $sum: '$fundedAmount' } } },
    { $sort: { funded: -1 } },
  ]);

  const recentUsers = await User.find({ role: 'user' }).sort('-createdAt').limit(5)
    .select('firstName lastName email createdAt avatar').lean();

  const recentInvestments = await UserInvestment.find().sort('-createdAt').limit(8)
    .populate('user', 'firstName lastName email')
    .populate('investment', 'title')
    .lean();

  const label = (id) => `${id.y}-${String(id.m).padStart(2, '0')}`;
  const growth = newUsersByMonth.map((n) => ({ label: label(n._id), users: n.count }));
  const volume = investedByMonth.map((n) => ({ label: label(n._id), invested: n.total }));

  return sendSuccess(res, {
    message: 'Analytics overview',
    data: {
      stats: {
        totalUsers: users,
        activeInvestors: activeInvestors.length,
        totalInvestments: investments,
        activeInvestments,
        totalInvested: money?.totalInvested || 0,
        totalReturns: money?.totalReturns || 0,
        revenue: revenue?.total || 0,
      },
      charts: { growth, volume, byCategory: byCategory.map((c) => ({ label: c._id, count: c.count, funded: c.funded })) },
      recentUsers,
      recentInvestments,
    },
  });
});

module.exports = { getOverview };