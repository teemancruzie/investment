const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Runs express-validator chains then converts failures into a 422. */
const validate = (chains = []) => [
  ...chains,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.unprocessable('Validation failed', details));
  },
];

module.exports = validate;
