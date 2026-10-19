const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/user.controller');
const v = require('../validations/common.validation');

const router = express.Router();

router.use(protect);

// Self-service profile
router.patch('/profile', validate(v.profileRules), ctrl.updateProfile);
router.patch('/preferences', ctrl.updatePreferences);
router.patch('/security', ctrl.updateSecurity);
router.delete('/me', ctrl.deleteAccount);

// Admin user management
router.use(authorize('admin'));
router.get('/', ctrl.listUsers);
router.get('/:id', validate(v.idRule), ctrl.getUser);
router.patch('/:id/status', validate(v.statusRules), ctrl.setUserStatus);
router.patch('/:id/role', validate(v.roleRules), ctrl.setUserRole);
router.delete('/:id', validate(v.idRule), ctrl.deleteUser);

module.exports = router;
