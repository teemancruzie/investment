const express = require('express');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/auth.controller');
const v = require('../validations/auth.validation');

const router = express.Router();

router.post('/register', authLimiter, validate(v.registerRules), ctrl.register);
router.post('/login', authLimiter, validate(v.loginRules), ctrl.login);
router.post('/admin/login', authLimiter, validate(v.loginRules), ctrl.adminLogin);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', authLimiter, validate(v.forgotPasswordRules), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPasswordRules), ctrl.resetPassword);
router.post('/verify-email', validate(v.verifyEmailRules), ctrl.verifyEmail);

router.use(protect);
router.get('/me', ctrl.me);
router.post('/resend-verification', ctrl.resendVerification);
router.post('/change-password', validate(v.changePasswordRules), ctrl.changePassword);

module.exports = router;
