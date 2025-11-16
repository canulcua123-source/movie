const express = require('express');
const router = express.Router();
const { getProfileStats } = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/authMiddleware');
const checkBanned = require('../middleware/checkBanned');

// GET /api/profile/stats (auth)
router.get('/stats', authMiddleware, checkBanned, getProfileStats);

module.exports = router;
