const Razorpay = require('razorpay');
const { decrypt } = require('../../utils/encryption');
const { verifyRazorpaySignature } = require('../../utils/verifyRazorpaySignature');

// Builds a Razorpay client using THIS store's own connected credentials —
// never a platform-wide key. Each store owner's money goes to their own
// Razorpay account; this platform never sits in the payment flow.
function getClient(store) {
  const cfg = store.paymentSettings?.razorpay;
  if (!cfg?.keyId || !cfg?.keySecretEnc) return null;
  const keySecret = decrypt(cfg.keySecretEnc);
  return new Razorpay({ key_id: cfg.keyId, key_secret: keySecret });
}

async function createOrder({ store, order }) {
  const client = getClient(store);
  if (!client) throw Object.assign(new Error('Razorpay is not connected for this store.'), { statusCode: 503 });

  const amountInSubunits = Math.round(order.total * 100); // Razorpay wants paise
  const rzpOrder = await client.orders.create({
    amount: amountInSubunits,
    currency: 'INR', // Razorpay is INR-only regardless of store.currency — see CHANGES.md
    receipt: order.orderNumber,
    notes: { multistoreOrderId: order._id.toString(), storeId: store._id.toString() },
  });

  return {
    gatewayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    // Key ID is a public identifier (not secret) — safe to send to the browser
    // so it can open the Razorpay checkout widget.
    publicConfig: { keyId: store.paymentSettings.razorpay.keyId },
  };
}

async function verifyPayment({ store, order, payload }) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
  const cfg = store.paymentSettings?.razorpay;
  if (!cfg?.keySecretEnc) return { verified: false, reason: 'Razorpay not connected for this store.' };
  if (order.paymentGateway.gatewayOrderId !== razorpay_order_id) {
    return { verified: false, reason: 'Order/payment mismatch.' };
  }

  const keySecret = decrypt(cfg.keySecretEnc);
  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    keySecret,
  });

  if (!isValid) return { verified: false, reason: 'Signature mismatch.' };
  return { verified: true, gatewayPaymentId: razorpay_payment_id, verificationRef: razorpay_signature };
}

module.exports = { createOrder, verifyPayment };
