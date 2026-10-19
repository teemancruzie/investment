const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/wallet.controller');
const v = require('../validations/common.validation');

const router = express.Router();

// Asset catalogue and live rates are useful before a wallet exists.
router.get('/assets', ctrl.getCryptoAssets);

router.use(protect);
router.get('/', ctrl.getWallet);
router.get('/deposits', ctrl.listDeposits);
router.get('/deposits/:id', ctrl.getDeposit);
router.post('/deposits/crypto', validate(v.cryptoDepositRules), ctrl.createCryptoDeposit);
router.post('/withdraw', validate(v.cryptoWithdrawRules), ctrl.withdraw);

module.exports = router;
