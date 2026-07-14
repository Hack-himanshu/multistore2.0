const Order = require('../models/Order');
const Store = require('../models/Store');
const { asyncHandler } = require('../middleware/errorHandler');
const { getProvider } = require('../services/paymentProviders');

// ─── POST /api/payments/public/:storeSlug/create-order ───────────────────────
// Dispatches to whichever gateway THIS store has connected (Store.paymentSettings.provider).
// The amount always comes from the order document in our own DB — never from
// the client — so nobody can pay ₹1 for a ₹5000 cart by tampering with the request.
const createGatewayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const storeId = req.store._id; // 🔑 from resolveStore — cannot be spoofed

  // 🔑 Explicitly select the encrypted secret fields — they're `select: false`
  // by default (see Store.js), so a normal query never even fetches them.
  const store = await Store.findById(storeId)
    .select('+paymentSettings.razorpay.keySecretEnc +paymentSettings.stripe.secretKeyEnc +paymentSettings.paypal.clientSecretEnc');

  const provider = store.paymentSettings?.provider;
  if (!provider || provider === 'none') {
    return res.status(503).json({
      success: false,
      message: 'This store has not connected an online payment method yet. Please use Cash on Delivery.',
    });
  }

  const order = await Order.findOne({ _id: orderId, storeId }); // 🔑
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'This order has already been paid for.' });
  }

  const gateway = getProvider(provider);
  const successUrl = `${process.env.CLIENT_URL}/store/${req.params.storeSlug}/checkout/complete`;
  const cancelUrl = `${process.env.CLIENT_URL}/store/${req.params.storeSlug}/checkout`;

  const result = await gateway.createOrder({ store, order, successUrl, cancelUrl });

  order.paymentGateway.provider = provider;
  order.paymentGateway.gatewayOrderId = result.gatewayOrderId;
  order.paymentMethod = provider;
  await order.save();

  res.status(200).json({
    success: true,
    provider,
    orderId: order._id,
    gatewayOrderId: result.gatewayOrderId,
    amount: result.amount,
    currency: result.currency,
    checkoutUrl: result.checkoutUrl, // present for Stripe (redirect flow)
    publicConfig: result.publicConfig, // present for Razorpay/PayPal (widget/SDK flow)
  });
});

// ─── POST /api/payments/public/:storeSlug/verify ──────────────────────────────
// Verifies the payment with the actual gateway's API/signature — never trusts
// a "success" message from the frontend alone, since that can be faked by
// anyone with devtools open.
const verifyGatewayPayment = asyncHandler(async (req, res) => {
  const { orderId, ...payload } = req.body;
  const storeId = req.store._id; // 🔑

  const store = await Store.findById(storeId)
    .select('+paymentSettings.razorpay.keySecretEnc +paymentSettings.stripe.secretKeyEnc +paymentSettings.paypal.clientSecretEnc');

  // Stripe/PayPal redirect the browser straight back from their own hosted
  // page — that URL only carries THEIR session/order token (session_id /
  // token), not our internal MongoDB orderId. Fall back to looking the order
  // up by its stored gatewayOrderId in that case (still scoped to this
  // store, so it can't be used to probe another store's orders).
  let order;
  if (orderId) {
    order = await Order.findOne({ _id: orderId, storeId }); // 🔑
  } else {
    const lookupKey = payload.session_id || payload.paypalOrderId;
    if (!lookupKey) {
      return res.status(400).json({ success: false, message: 'Missing orderId or gateway reference.' });
    }
    order = await Order.findOne({ storeId, 'paymentGateway.gatewayOrderId': lookupKey }); // 🔑
  }

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const provider = order.paymentGateway?.provider;
  if (!provider || provider === 'none') {
    return res.status(400).json({ success: false, message: 'This order has no online payment attached to verify.' });
  }

  const gateway = getProvider(provider);
  const result = await gateway.verifyPayment({ store, order, payload });

  if (!result.verified) {
    order.paymentStatus = 'failed';
    await order.save();
    return res.status(400).json({ success: false, message: result.reason || 'Payment verification failed.' });
  }

  // Verified — this is a genuinely confirmed payment.
  order.paymentStatus = 'paid';
  order.paymentGateway.gatewayPaymentId = result.gatewayPaymentId;
  order.paymentGateway.verificationRef = result.verificationRef;
  order.status = order.status === 'pending' ? 'confirmed' : order.status;
  await order.save();

  // Revenue only counted now that payment is actually confirmed.
  await Store.findByIdAndUpdate(storeId, { $inc: { 'stats.totalRevenue': order.total } });

  res.status(200).json({ success: true, message: 'Payment verified successfully.', order });
});

module.exports = { createGatewayOrder, verifyGatewayPayment };
