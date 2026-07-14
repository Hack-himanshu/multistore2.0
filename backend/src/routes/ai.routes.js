const express = require('express');
const router = express.Router();
const { chat, generateDescription } = require('../controllers/ai.controller');
const { protect, restrictTo } = require('../middleware/auth');

// All AI routes require auth (StoreOwner only)
router.post('/chat', protect, restrictTo('StoreOwner'), chat);
router.post('/generate-description', protect, restrictTo('StoreOwner'), generateDescription);

module.exports = router;
