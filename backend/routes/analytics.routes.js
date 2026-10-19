const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getOverview } = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/overview', protect, authorize('admin'), getOverview);

module.exports = router;
