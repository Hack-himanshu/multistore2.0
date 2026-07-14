const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  registerCustomer,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');

// ─── Validation Rules ─────────────────────────────────────────────────────────
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('storeName').optional().trim().isLength({ min: 2, max: 80 }),
  handleValidationErrors,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors,
];

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/register', registerValidation, register);
router.post('/register-customer', registerValidation, registerCustomer);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/update-profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
