const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const { signAccessToken, signRefreshToken, verifyRefreshToken, createRandomToken, hashToken } = require('../utils/token');
const { getOrCreateWallet } = require('../services/wallet.service');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: `${user.firstName} ${user.lastName}`,
  email: user.email,
  phone: user.phone,
  country: user.country,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  isEmailVerified: user.isEmailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  notificationPreferences: user.notificationPreferences,
  createdAt: user.createdAt,
});

const issueTokens = (user) => ({
  accessToken: signAccessToken({ sub: user._id.toString(), role: user.role }),
  refreshToken: signRefreshToken({ sub: user._id.toString() }),
});

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const { raw, hashed } = createRandomToken();
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    emailVerificationToken: hashed,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await getOrCreateWallet(user._id);
  await sendVerificationEmail(user.email, raw);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created',
    data: { user: publicUser(user), ...issueTokens(user) },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.status === 'disabled') throw ApiError.forbidden('This account has been disabled');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  await getOrCreateWallet(user._id);

  return sendSuccess(res, { message: 'Signed in', data: { user: publicUser(user), ...issueTokens(user) } });
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid credentials');
  if (user.role !== 'admin') throw ApiError.forbidden('Administrator access only');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { message: 'Signed in', data: { user: publicUser(user), ...issueTokens(user) } });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.unauthorized('Refresh token required');
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.sub);
  if (!user || user.status === 'disabled') throw ApiError.unauthorized('Session no longer valid');
  return sendSuccess(res, { message: 'Session refreshed', data: issueTokens(user) });
});

const logout = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Signed out', data: null })
);

const me = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Current user', data: { user: publicUser(req.user) } })
);

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  // Always answer the same way so emails cannot be enumerated.
  if (user) {
    const { raw, hashed } = createRandomToken();
    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user.email, raw);
  }
  return sendSuccess(res, { message: 'If that email exists, a reset link has been sent', data: null });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sendSuccess(res, { message: 'Password updated', data: { user: publicUser(user), ...issueTokens(user) } });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    emailVerificationToken: hashToken(req.body.token),
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) throw ApiError.badRequest('Verification link is invalid or has expired');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { message: 'Email verified', data: { user: publicUser(user) } });
});

const resendVerification = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.isEmailVerified) throw ApiError.badRequest('Email already verified');
  const { raw, hashed } = createRandomToken();
  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user.email, raw);
  return sendSuccess(res, { message: 'Verification email sent', data: null });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw ApiError.badRequest('Current password is incorrect');
  user.password = newPassword;
  await user.save();
  return sendSuccess(res, { message: 'Password changed', data: issueTokens(user) });
});

module.exports = {
  publicUser,
  register,
  login,
  adminLogin,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
};
