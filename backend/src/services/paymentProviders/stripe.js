const Stripe = require('stripe');
const { decrypt } = require('../../utils/encryption');

// Builds a Stripe client using THIS store's own connected secret key.
function getClient(store) {
  const cfg = store.paymentSettings?.stripe;
  if (!cfg?.secretKeyEnc) return null;
  const secretKey = decrypt(cfg.secretKeyEnc);
  return new Stripe(secretKey);
}

// Stripe Checkout is a hosted payment page — Stripe handles all card/PCI
// concerns, we never touch card data. Customer is redirected to Stripe, then
// back to successUrl/cancelUrl with the session id in the query string.
async function createOrder({ store, order, successUrl, cancelUrl }) {
  const client = getClient(store);
  if (!client) throw Object.assign(new Error('Stripe is not connected for this store.'), { statusCode: 503 });

  const session = await client.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: (store.currency || 'usd').toLowerCase(),
        product_data: { name: `Order ${order.orderNumber}` },
        unit_amount: Math.round(order.total * 100), // Stripe wants the smallest currency unit
      },
      quantity: 1,
    }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { multistoreOrderId: order._id.toString(), storeId: store._id.toString() },
  });

  return {
    gatewayOrderId: session.id,
    checkoutUrl: session.url, // Frontend redirects the browser here
    publicConfig: { publishableKey: store.paymentSettings.stripe.publishableKey },
  };
}

// Called when the customer lands back on successUrl. We don't trust the
// redirect alone (anyone can hit that URL) — re-fetch the session from
// Stripe's API and check its actual payment_status server-side.
async function verifyPayment({ store, order, payload }) {
  const client = getClient(store);
  if (!client) return { verified: false, reason: 'Stripe not connected for this store.' };

  const { session_id: sessionId } = payload;
  if (order.paymentGateway.gatewayOrderId !== sessionId) {
    return { verified: false, reason: 'Order/session mismatch.' };
  }

  const session = await client.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid') {
    return { verified: false, reason: `Stripe reports payment_status: ${session.payment_status}` };
  }

  return {
    verified: true,
    gatewayPaymentId: session.payment_intent || sessionId,
    verificationRef: sessionId,
  };
}

module.exports = { createOrder, verifyPayment };
