const express = require('express');
const { protect } = require('../middleware/auth');
const { listTransactions } = require('../controllers/wallet.controller');

const router = express.Router();

router.get('/', protect, listTransactions);

module.exports = router;
