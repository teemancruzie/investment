const express = require('express');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/market.controller');

const router = express.Router();

router.get('/quotes', ctrl.quotes);
router.get('/holdings', protect, ctrl.holdings);
router.get('/orders', protect, ctrl.orders);
router.post('/buy', protect, ctrl.buy);
router.post('/sell', protect, ctrl.sell);

module.exports = router;
