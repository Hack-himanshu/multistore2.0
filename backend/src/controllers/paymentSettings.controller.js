const Store = require('../models/Store');
const { asyncHandler } = require('../middleware/errorHandler');
const { encrypt } = require('../utils/encryption');

// ─── Owner: View current payment settings (masked — never returns secrets) ──
const getPaymentSettings = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.user.storeId); // 🔑 — secrets already excluded by `select: false`
  const ps = store.paymentSettings || {};

  res.status(200).json({
    success: true,
    paymentSettings: {
      provider: ps.provider || 'none',
      razorpay: { keyId: ps.razorpay?.keyId || '', connected: !!ps.razorpay?.keyId },
      stripe: { publishableKey: ps.stripe?.publishableKey || '', connected: !!ps.stripe?.publishableKey },
      paypal: { clientId: ps.paypal?.clientId || '', mode: ps.paypal?.mode || 'sandbox', connected: !!ps.paypal?.clientId },
    },
  });
});

// ─── Owner: Connect/update a payment gateway ──────────────────────────────────
// Each store owner enters THEIR OWN gateway credentials here. Secrets are
// encrypted before being saved — never stored or returned in plaintext.
// Sending an empty secret field means "keep the existing one" (so the owner
// isn't forced to re-paste their secret key just to change a public field).
const updatePaymentSettings = asyncHandler(async (req, res) => {
  const { provider, razorpay, stripe, paypal } = req.body;

  const validProviders = ['none', 'razorpay', 'stripe', 'paypal'];
  if (provider && !validProviders.includes(provider)) {
    return res.status(422).json({ success: false, message: `Invalid provider. Must be one of: ${validProviders.join(', ')}` });
  }

  const store = await Store.findById(req.user.storeId).select(
    '+paymentSettings.razorpay.keySecretEnc +paymentSettings.stripe.secretKeyEnc +paymentSettings.paypal.clientSecretEnc'
  ); // 🔑

  if (!store.paymentSettings) store.paymentSettings = {};

  if (provider) store.paymentSettings.provider = provider;

  if (razorpay) {
    if (razorpay.keyId !== undefined) {
      if (!razorpay.keyId.startsWith('rzp_')) {
        return res.status(422).json({ success: false, message: 'Razorpay Key ID should start with "rzp_".' });
      }
      store.paymentSettings.razorpay.keyId = razorpay.keyId;
    }
    if (razorpay.keySecret) { // only overwrite if a new one was actually provided
      store.paymentSettings.razorpay.keySecretEnc = encrypt(razorpay.keySecret);
    }
  }

  if (stripe) {
    if (stripe.publishableKey !== undefined) {
      if (!stripe.publishableKey.startsWith('pk_')) {
        return res.status(422).json({ success: false, message: 'Stripe publishable key should start with "pk_".' });
      }
      store.paymentSettings.stripe.publishableKey = stripe.publishableKey;
    }
    if (stripe.secretKey) {
      if (!stripe.secretKey.startsWith('sk_')) {
        return res.status(422).json({ success: false, message: 'Stripe secret key should start with "sk_".' });
      }
      store.paymentSettings.stripe.secretKeyEnc = encrypt(stripe.secretKey);
    }
  }

  if (paypal) {
    if (paypal.clientId !== undefined) store.paymentSettings.paypal.clientId = paypal.clientId;
    if (paypal.mode) store.paymentSettings.paypal.mode = paypal.mode === 'live' ? 'live' : 'sandbox';
    if (paypal.clientSecret) {
      store.paymentSettings.paypal.clientSecretEnc = encrypt(paypal.clientSecret);
    }
  }

  await store.save();

  res.status(200).json({
    success: true,
    message: 'Payment settings updated.',
    paymentSettings: {
      provider: store.paymentSettings.provider,
      razorpay: { keyId: store.paymentSettings.razorpay?.keyId || '' },
      stripe: { publishableKey: store.paymentSettings.stripe?.publishableKey || '' },
      paypal: { clientId: store.paymentSettings.paypal?.clientId || '', mode: store.paymentSettings.paypal?.mode },
    },
  });
});

module.exports = { getPaymentSettings, updatePaymentSettings };
