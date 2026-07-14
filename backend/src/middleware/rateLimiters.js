const rateLimit = require('express-rate-limit');

// Applied to every request.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Login/register/change-password — brute-force protection.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'AI rate limit reached. Please wait a moment.' },
});

// Public, unauthenticated checkout endpoints (guest order creation + Razorpay
// create-order/verify). These are the easiest routes for a script to hammer —
// each hit can create a real order (real stock decrement) or open a real
// Razorpay order — so they're capped tighter than general public browsing.
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many checkout attempts. Please wait a few minutes and try again.' },
});

module.exports = { globalLimiter, authLimiter, aiLimiter, checkoutLimiter };
