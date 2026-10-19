const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/investment.controller');
const v = require('../validations/common.validation');

const router = express.Router();

router.get('/', ctrl.listInvestments);
router.get('/mine/list', protect, ctrl.myInvestments);
router.get('/:id', ctrl.getInvestment);

router.post('/:id/invest', protect, validate(v.investRules), ctrl.invest);

router.use(protect, authorize('admin'));
router.post('/', validate(v.investmentRules), ctrl.createInvestment);
router.patch('/:id', validate([...v.idRule, ...v.investmentUpdateRules]), ctrl.updateInvestment);
router.patch('/:id/archive', validate(v.idRule), ctrl.archiveInvestment);
router.delete('/:id', validate(v.idRule), ctrl.deleteInvestment);

module.exports = router;
