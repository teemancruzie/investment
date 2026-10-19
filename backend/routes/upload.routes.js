const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadInvestment, uploadTeam, uploadAvatar, uploadProof } = require('../middleware/upload');
const { uploadSingle, uploadMany } = require('../controllers/upload.controller');

const router = express.Router();

router.use(protect);

// Any signed-in user can replace their own avatar
router.post('/avatar', uploadAvatar.single('file'), uploadSingle('avatars'));
// Proof-of-payment screenshots for crypto deposits
router.post('/proof', uploadProof.single('file'), uploadSingle('proofs'));

router.use(authorize('admin'));
router.post('/investment', uploadInvestment.single('file'), uploadSingle('investments'));
router.post('/investment/gallery', uploadInvestment.array('files', 8), uploadMany('investments'));
router.post('/team', uploadTeam.single('file'), uploadSingle('team'));

module.exports = router;
