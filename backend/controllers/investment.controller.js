const Investment = require('../models/Investment');
const UserInvestment = require('../models/UserInvestment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const { paginate, escapeRegex } = require('../utils/queryFeatures');
const { applyTransaction } = require('../services/wallet.service');
const { notifyUser } = require('../services/notification.service');

const SORTS = {
  newest: '-createdAt',
  oldest: 'createdAt',
  'return-desc': '-expectedAnnualReturn',
  'return-asc': 'expectedAnnualReturn',
  'min-asc': 'minimumInvestment',
  'min-desc': '-minimumInvestment',
  'funding-desc': '-fundedAmount',
};

function buildFilter(query, { adminView = false } = {}) {
  const { search, category, riskLevel, status, minReturn, maxReturn, minAmount, maxAmount, featured } = query;
  const filter = {};

  filter.status = adminView ? status || { $ne: null } : status || { $in: ['active', 'funded'] };
  if (adminView && !status) delete filter.status;

  if (category) filter.category = category;
  if (riskLevel) filter.riskLevel = { $in: String(riskLevel).split(',') };
  if (featured === 'true') filter.isFeatured = true;
  if (minReturn || maxReturn) {
    filter.expectedAnnualReturn = {};
    if (minReturn) filter.expectedAnnualReturn.$gte = Number(minReturn);
    if (maxReturn) filter.expectedAnnualReturn.$lte = Number(maxReturn);
  }
  if (minAmount || maxAmount) {
    filter.minimumInvestment = {};
    if (minAmount) filter.minimumInvestment.$gte = Number(minAmount);
    if (maxAmount) filter.minimumInvestment.$lte = Number(maxAmount);
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { summary: rx }, { location: rx }];
  }
  return filter;
}

const decorate = (doc) => ({
  ...doc,
  id: doc._id,
  availableUnits: Math.max(0, (doc.totalUnits || 0) - (doc.unitsSold || 0)),
  fundingProgress: doc.fundingGoal ? Math.min(100, Number(((doc.fundedAmount / doc.fundingGoal) * 100).toFixed(2))) : 0,
});

const listInvestments = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, { adminView: req.user?.role === 'admin' && req.query.adminView === 'true' });
  const { items, meta } = await paginate(Investment, {
    filter,
    page: req.query.page,
    limit: req.query.limit,
    sort: SORTS[req.query.sort] || SORTS.newest,
    populate: { path: 'category', select: 'name slug' },
  });
  return sendSuccess(res, { message: 'Investments', data: items.map(decorate), meta });
});

const getInvestment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const byId = id.match(/^[0-9a-fA-F]{24}$/);
  const investment = await Investment.findOne(byId ? { _id: id } : { slug: id })
    .populate('category', 'name slug')
    .lean();
  if (!investment) throw ApiError.notFound('Investment not found');
  return sendSuccess(res, { message: 'Investment', data: decorate(investment) });
});

const createInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.create({ ...req.body, createdBy: req.user._id });
  return sendSuccess(res, { statusCode: 201, message: 'Investment created', data: investment });
});

const updateInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.id);
  if (!investment) throw ApiError.notFound('Investment not found');
  Object.assign(investment, req.body);
  await investment.save();
  return sendSuccess(res, { message: 'Investment updated', data: investment });
});

const archiveInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findByIdAndUpdate(
    req.params.id,
    { status: 'archived' },
    { new: true }
  );
  if (!investment) throw ApiError.notFound('Investment not found');
  return sendSuccess(res, { message: 'Investment archived', data: investment });
});

const deleteInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findByIdAndDelete(req.params.id);
  if (!investment) throw ApiError.notFound('Investment not found');
  return sendSuccess(res, { message: 'Investment deleted', data: null });
});

/** Invests wallet funds into an opportunity. */
const invest = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const investment = await Investment.findById(req.params.id);
  if (!investment) throw ApiError.notFound('Investment not found');
  if (investment.status !== 'active') throw ApiError.badRequest('This opportunity is not open for investment');
  if (amount < investment.minimumInvestment) {
    throw ApiError.badRequest(`Minimum investment is ${investment.minimumInvestment}`);
  }

  const unitPrice = investment.fundingGoal / investment.totalUnits;
  const units = Math.max(1, Math.floor(amount / unitPrice));
  if (units > investment.totalUnits - investment.unitsSold) throw ApiError.badRequest('Not enough units available');

  await applyTransaction(req.user._id, {
    type: 'investment',
    amount,
    investment: investment._id,
    description: `Investment in ${investment.title}`,
  });

  investment.fundedAmount += amount;
  investment.unitsSold += units;
  if (investment.fundedAmount >= investment.fundingGoal) investment.status = 'funded';
  await investment.save();

  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + investment.durationMonths);

  const position = await UserInvestment.create({
    user: req.user._id,
    investment: investment._id,
    amount,
    units,
    expectedReturn: Number((amount * (investment.expectedAnnualReturn / 100) * (investment.durationMonths / 12)).toFixed(2)),
    maturityDate,
  });

  await notifyUser(req.user._id, {
    title: 'Investment confirmed',
    message: `You invested ${amount} in ${investment.title}.`,
    type: 'success',
  });

  return sendSuccess(res, { statusCode: 201, message: 'Investment confirmed', data: position });
});

const myInvestments = asyncHandler(async (req, res) => {
  const { items, meta } = await paginate(UserInvestment, {
    filter: { user: req.user._id, ...(req.query.status ? { status: req.query.status } : {}) },
    page: req.query.page,
    limit: req.query.limit,
    sort: '-createdAt',
    populate: { path: 'investment', select: 'title image category expectedAnnualReturn riskLevel durationMonths' },
  });
  return sendSuccess(res, { message: 'My investments', data: items, meta });
});

module.exports = {
  listInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  archiveInvestment,
  deleteInvestment,
  invest,
  myInvestments,
};
