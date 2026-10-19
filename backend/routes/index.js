const express = require('express');

const router = express.Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'API is healthy', data: { uptime: process.uptime(), time: new Date().toISOString() } })
);

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/investments', require('./investment.routes'));
router.use('/categories', require('./category.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/wallet', require('./wallet.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/content', require('./content.routes'));
router.use('/markets', require('./market.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/uploads', require('./upload.routes'));

module.exports = router;
