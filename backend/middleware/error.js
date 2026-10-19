const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

/* eslint-disable no-unused-vars */
function errorHandler(err, _req, res, _next) {
  let error = err;

  if (error.name === 'CastError') error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.unprocessable('Validation failed', details);
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || { field: '' })[0];
    error = ApiError.conflict(`${field} already exists`);
  }
  if (error.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid token');
  if (error.name === 'TokenExpiredError') error = ApiError.unauthorized('Session expired');
  if (error.code === 'LIMIT_FILE_SIZE') error = ApiError.badRequest('File is too large');

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: statusCode === 500 && env.nodeEnv === 'production' ? 'Internal server error' : error.message,
    ...(error.details ? { errors: error.details } : {}),
  };

  if (env.nodeEnv !== 'production') payload.stack = err.stack;
  if (statusCode === 500) console.error(err);

  return res.status(statusCode).json(payload);
}

module.exports = errorHandler;
