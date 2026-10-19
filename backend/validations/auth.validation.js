const { body } = require('express-validator');

const password = (field = 'password') =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number');

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 60 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  password('password'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail()];

const resetPasswordRules = [body('token').isString().notEmpty(), password('password')];

const verifyEmailRules = [body('token').isString().notEmpty()];

const changePasswordRules = [body('currentPassword').isString().notEmpty(), password('newPassword')];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  verifyEmailRules,
  changePasswordRules,
};
