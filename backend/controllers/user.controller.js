const User = require('../models/User');
const UserInvestment = require('../models/UserInvestment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const { paginate, escapeRegex } = require('../utils/queryFeatures');
const { publicUser } = require('./auth.controller');

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName', 'phone', 'country', 'avatar'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  return sendSuccess(res, { message: 'Profile updated', data: { user: publicUser(req.user) } });
});

const updatePreferences = asyncHandler(async (req, res) => {
  req.user.notificationPreferences = {
    ...req.user.notificationPreferences.toObject?.() ?? req.user.notificationPreferences,
    ...req.body,
  };
  await req.user.save();
  return sendSuccess(res, { message: 'Preferences updated', data: { user: publicUser(req.user) } });
});

const updateSecurity = asyncHandler(async (req, res) => {
  if (req.body.twoFactorEnabled !== undefined) req.user.twoFactorEnabled = !!req.body.twoFactorEnabled;
  await req.user.save();
  return sendSuccess(res, { message: 'Security settings updated', data: { user: publicUser(req.user) } });
});

const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  return sendSuccess(res, { message: 'Account deleted', data: null });
});

/* ----------------------------- Admin endpoints ---------------------------- */

const listUsers = asyncHandler(async (req, res) => {
  const { search, role, status, page, limit, sort } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }

  const { items, meta } = await paginate(User, { filter, page, limit, sort: sort || '-createdAt' });
  return sendSuccess(res, { message: 'Users', data: items.map(publicUser), meta });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  const investments = await UserInvestment.find({ user: user._id }).populate('investment', 'title image').lean();
  return sendSuccess(res, { message: 'User', data: { user: publicUser(user), investments } });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot change your own status');
  user.status = req.body.status;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, { message: `User ${user.status}`, data: publicUser(user) });
});

const setUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot change your own role');
  user.role = req.body.role;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, { message: 'Role updated', data: publicUser(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot delete your own account here');
  await user.deleteOne();
  return sendSuccess(res, { message: 'User deleted', data: null });
});

module.exports = {
  updateProfile,
  updatePreferences,
  updateSecurity,
  deleteAccount,
  listUsers,
  getUser,
  setUserStatus,
  setUserRole,
  deleteUser,
};
