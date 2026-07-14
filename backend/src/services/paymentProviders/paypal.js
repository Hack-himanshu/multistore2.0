const { decrypt } = require('../../utils/encryption');

function baseUrl(mode) {
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

// PayPal uses OAuth2 client-credentials — exchange clientId/secret for a
// short-lived access token before every order/capture call (tokens aren't
// cached here for simplicity; fine at this scale, worth caching later if
// checkout volume gets high enough to matter).
async function getAccessToken(store) {
  const cfg = store.paymentSettings?.paypal;
  if (!cfg?.clientId || !cfg?.clientSecretEnc) return null;
  const clientSecret = decrypt(cfg.clientSecretEnc);
  const basicAuth = Buffer.from(`${cfg.clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${baseUrl(cfg.mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function createOrder({ store, order, successUrl, cancelUrl }) {
  const cfg = store.paymentSettings?.paypal;
  if (!cfg?.clientId || !cfg?.clientSecretEnc) {
    throw Object.assign(new Error('PayPal is not connected for this store.'), { statusCode: 503 });
  }
  const token = await getAccessToken(store);

  // PayPal's currency codes are ISO 4217 (USD, EUR, INR is NOT supported for
  // most PayPal accounts — worth flagging to Indian store owners specifically).
  const res = await fetch(`${baseUrl(cfg.mode)}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.orderNumber,
        amount: { currency_code: (store.currency || 'USD').toUpperCase(), value: order.total.toFixed(2) },
      }],
      // Redirect flow (same shape as Stripe Checkout) rather than the
      // separate PayPal Buttons JS SDK — one consistent frontend pattern
      // for every redirect-based gateway instead of three different UX flows.
      application_context: {
        return_url: successUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW',
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal create-order failed: ${res.status} ${await res.text()}`);
  const data = await res.json();

  const approveLink = data.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action')?.href;

  return {
    gatewayOrderId: data.id,
    checkoutUrl: approveLink, // Frontend redirects the browser here, same as Stripe
  };
}

// Called when the customer lands back on successUrl (PayPal appends
// ?token=<order id>&PayerID=... to return_url — `token` IS the PayPal order id).
// Capture is the step that actually moves money and must happen server-side
// (never trust the redirect alone — anyone could hit that URL directly).
async function verifyPayment({ store, order, payload }) {
  const cfg = store.paymentSettings?.paypal;
  if (!cfg?.clientId) return { verified: false, reason: 'PayPal not connected for this store.' };

  const { paypalOrderId } = payload;
  if (order.paymentGateway.gatewayOrderId !== paypalOrderId) {
    return { verified: false, reason: 'Order mismatch.' };
  }

  const token = await getAccessToken(store);
  const res = await fetch(`${baseUrl(cfg.mode)}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();

  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!res.ok || capture?.status !== 'COMPLETED') {
    return { verified: false, reason: `PayPal capture status: ${capture?.status || res.status}` };
  }

  return { verified: true, gatewayPaymentId: capture.id, verificationRef: paypalOrderId };
}

module.exports = { createOrder, verifyPayment };
