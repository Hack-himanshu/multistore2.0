const crypto = require('crypto');

describe('payment provider dispatcher', () => {
  const { getProvider } = require('../../src/services/paymentProviders');

  it('returns the razorpay module', () => {
    const p = getProvider('razorpay');
    expect(typeof p.createOrder).toBe('function');
    expect(typeof p.verifyPayment).toBe('function');
  });

  it('returns the stripe module', () => {
    const p = getProvider('stripe');
    expect(typeof p.createOrder).toBe('function');
    expect(typeof p.verifyPayment).toBe('function');
  });

  it('returns the paypal module', () => {
    const p = getProvider('paypal');
    expect(typeof p.createOrder).toBe('function');
    expect(typeof p.verifyPayment).toBe('function');
  });

  it('throws for an unknown/unconfigured provider name', () => {
    expect(() => getProvider('dogecoin')).toThrow(/Unknown or unconfigured/);
  });

  it('throws for "none"', () => {
    expect(() => getProvider('none')).toThrow();
  });
});

describe('provider guards: refuses to proceed when a store has not connected that gateway', () => {
  const razorpay = require('../../src/services/paymentProviders/razorpay');
  const stripeProvider = require('../../src/services/paymentProviders/stripe');
  const paypal = require('../../src/services/paymentProviders/paypal');

  const bareStore = { _id: 'store1', paymentSettings: {} }; // nothing connected
  const fakeOrder = { _id: 'order1', orderNumber: 'MS-1', total: 10, paymentGateway: {} };

  it('razorpay.createOrder throws a clear 503 when not connected', async () => {
    await expect(razorpay.createOrder({ store: bareStore, order: fakeOrder }))
      .rejects.toMatchObject({ statusCode: 503, message: expect.stringContaining('not connected') });
  });

  it('stripe.createOrder throws a clear 503 when not connected', async () => {
    await expect(stripeProvider.createOrder({ store: bareStore, order: fakeOrder, successUrl: 'x', cancelUrl: 'y' }))
      .rejects.toMatchObject({ statusCode: 503, message: expect.stringContaining('not connected') });
  });

  it('paypal.createOrder throws a clear 503 when not connected', async () => {
    await expect(paypal.createOrder({ store: bareStore, order: fakeOrder, successUrl: 'x', cancelUrl: 'y' }))
      .rejects.toMatchObject({ statusCode: 503, message: expect.stringContaining('not connected') });
  });

  it('razorpay.verifyPayment reports not-connected instead of crashing', async () => {
    const result = await razorpay.verifyPayment({ store: bareStore, order: fakeOrder, payload: {} });
    expect(result.verified).toBe(false);
    expect(result.reason).toMatch(/not connected/);
  });

  it('stripe.verifyPayment reports not-connected instead of crashing', async () => {
    const result = await stripeProvider.verifyPayment({ store: bareStore, order: fakeOrder, payload: {} });
    expect(result.verified).toBe(false);
    expect(result.reason).toMatch(/not connected/);
  });

  it('paypal.verifyPayment reports not-connected instead of crashing', async () => {
    const result = await paypal.verifyPayment({ store: bareStore, order: fakeOrder, payload: {} });
    expect(result.verified).toBe(false);
    expect(result.reason).toMatch(/not connected/);
  });
});

describe('razorpay.verifyPayment catches an order/payment mismatch (replay protection)', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex') };
  });
  afterAll(() => { process.env = OLD_ENV; });

  it('rejects when the order was created against a different gatewayOrderId', async () => {
    const { encrypt } = require('../../src/utils/encryption');
    const razorpay = require('../../src/services/paymentProviders/razorpay');

    const store = {
      _id: 'store1',
      paymentSettings: { razorpay: { keyId: 'rzp_test_x', keySecretEnc: encrypt('shh') } },
    };
    const order = { _id: 'o1', paymentGateway: { gatewayOrderId: 'order_REAL' } };

    const result = await razorpay.verifyPayment({
      store,
      order,
      payload: { razorpay_order_id: 'order_DIFFERENT', razorpay_payment_id: 'pay_x', razorpay_signature: 'sig' },
    });
    expect(result.verified).toBe(false);
    expect(result.reason).toMatch(/mismatch/i);
  });
});
