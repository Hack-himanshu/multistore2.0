const crypto = require('crypto');

// Verifies the HMAC-SHA256 signature Razorpay returns after a checkout.
// This is the step that actually proves a payment happened — a frontend
// "success" callback alone can be faked from devtools, so nothing gets
// marked paid without this check passing.
function verifyRazorpaySignature({ orderId, paymentId, signature, keySecret }) {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Constant-time comparison — a plain `===` on secret-derived strings leaks
  // timing information that can, in theory, help an attacker guess the
  // correct signature byte-by-byte.
  const expectedBuf = Buffer.from(expected, 'hex');
  const signatureBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

module.exports = { verifyRazorpaySignature };
