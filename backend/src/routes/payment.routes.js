const express = require('express');
const { resolveStore } = require('../middleware/auth');
const { createGatewayOrder, verifyGatewayPayment } = require('../controllers/payment.controller');

const router = express.Router();

// Public — called from the storefront checkout. resolveStore attaches req.store
// from the URL slug, so the storeId used everywhere downstream can't be spoofed.
// Which actual gateway runs (Razorpay/Stripe/PayPal) is decided server-side by
// the store's own paymentSettings.provider — the client never picks this.
router.post('/public/:storeSlug/create-order', resolveStore, createGatewayOrder);
router.post('/public/:storeSlug/verify', resolveStore, verifyGatewayPayment);

module.exports = router;
