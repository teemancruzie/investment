const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');
const v = require('../validations/common.validation');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/requests', ctrl.listRequests);
router.get('/requests/summary', ctrl.requestSummary);
router.patch('/requests/:id/review', validate(v.reviewRules), ctrl.reviewRequest);

router.get('/withdrawals', ctrl.listWithdrawals);
router.patch('/withdrawals/:id/review', validate(v.withdrawalReviewRules), ctrl.reviewWithdrawal);

router.post('/deposits/:id/refresh', ctrl.refreshDepositConfirmations);

router.get('/users/:id/wallet', validate(v.idRule), ctrl.getUserWallet);
router.post('/users/:id/wallet/adjust', validate(v.walletAdjustRules), ctrl.adjustUserWallet);
router.patch('/users/:id/wallet/hold', validate(v.walletHoldRules), ctrl.setWalletHold);

router.get('/deposit-addresses', ctrl.listDepositAddresses);
router.put('/deposit-addresses', validate(v.depositAddressRules), ctrl.updateDepositAddress);

router.get('/payouts/preview', ctrl.previewPayouts);
router.post('/payouts/run', ctrl.executePayouts);

module.exports = router;
