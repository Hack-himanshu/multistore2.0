const crypto = require('crypto');
const { verifyRazorpaySignature } = require('../../src/utils/verifyRazorpaySignature');

describe('verifyRazorpaySignature', () => {
  const keySecret = 'test_razorpay_secret_key';
  const orderId = 'order_ABC123';
  const paymentId = 'pay_XYZ789';

  const sign = (secret, oid, pid) =>
    crypto.createHmac('sha256', secret).update(`${oid}|${pid}`).digest('hex');

  it('accepts a genuinely valid signature', () => {
    const signature = sign(keySecret, orderId, paymentId);
    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature, keySecret })
    ).toBe(true);
  });

  it('rejects a signature signed with the wrong secret (forged/guessed)', () => {
    const forged = sign('attacker_guessed_secret', orderId, paymentId);
    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature: forged, keySecret })
    ).toBe(false);
  });

  it('rejects a valid signature replayed against a different order/payment id', () => {
    const signature = sign(keySecret, orderId, paymentId);
    expect(
      verifyRazorpaySignature({ orderId: 'order_DIFFERENT', paymentId, signature, keySecret })
    ).toBe(false);
  });

  it('rejects garbage/non-hex input without throwing', () => {
    expect(() =>
      verifyRazorpaySignature({ orderId, paymentId, signature: 'not-a-real-signature', keySecret })
    ).not.toThrow();
    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature: 'not-a-real-signature', keySecret })
    ).toBe(false);
  });

  it('rejects when any required field is missing', () => {
    expect(verifyRazorpaySignature({ orderId, paymentId, signature: '', keySecret })).toBe(false);
    expect(verifyRazorpaySignature({ orderId, paymentId, signature: 'abc', keySecret: '' })).toBe(false);
    expect(verifyRazorpaySignature({})).toBe(false);
  });
});
