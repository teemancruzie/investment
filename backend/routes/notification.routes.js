const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');
const v = require('../validations/common.validation');

const router = express.Router();

router.use(protect);
router.get('/', ctrl.listMine);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', validate(v.idRule), ctrl.markRead);

router.post('/broadcast', authorize('admin'), validate(v.broadcastRules), ctrl.createBroadcast);
router.delete('/:id', authorize('admin'), validate(v.idRule), ctrl.deleteNotification);

module.exports = router;
