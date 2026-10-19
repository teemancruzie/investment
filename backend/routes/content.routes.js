const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/content.controller');

const router = express.Router();

// Public reads
router.get('/testimonials', ctrl.testimonials.list);
router.get('/faqs', ctrl.faqs.list);
router.get('/team', ctrl.team.list);
router.get('/settings', ctrl.getSettings);

// Admin writes
router.use(protect, authorize('admin'));
router.post('/testimonials', ctrl.testimonials.create);
router.patch('/testimonials/:id', ctrl.testimonials.update);
router.delete('/testimonials/:id', ctrl.testimonials.remove);

router.post('/faqs', ctrl.faqs.create);
router.patch('/faqs/:id', ctrl.faqs.update);
router.delete('/faqs/:id', ctrl.faqs.remove);

router.post('/team', ctrl.team.create);
router.patch('/team/:id', ctrl.team.update);
router.delete('/team/:id', ctrl.team.remove);

router.put('/settings', ctrl.upsertSettings);

module.exports = router;
