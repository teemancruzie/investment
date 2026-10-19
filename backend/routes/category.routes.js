const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/category.controller');
const v = require('../validations/common.validation');

const router = express.Router();

router.get('/', ctrl.listCategories);

router.use(protect, authorize('admin'));
router.post('/', validate(v.categoryRules), ctrl.createCategory);
router.patch('/:id', validate(v.idRule), ctrl.updateCategory);
router.delete('/:id', validate(v.idRule), ctrl.deleteCategory);

module.exports = router;
