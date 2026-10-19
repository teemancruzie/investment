const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.accessToken) return req.cookies.accessToken;
  return null;
}

const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await User.findById(decoded.sub).select('+passwordChangedAt');
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.status === 'disabled') throw ApiError.forbidden('This account has been disabled');
  if (user.passwordChangedAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password recently changed, please sign in again');
  }

  req.user = user;
  return next();
});

/** Role gate: authorize('admin') */
const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
    return next();
  };

module.exports = { protect, authorize };
