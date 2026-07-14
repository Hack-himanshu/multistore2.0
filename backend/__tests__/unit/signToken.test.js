const jwt = require('jsonwebtoken');

describe('signToken (auth.controller.js)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, JWT_SECRET: 'unit_test_secret_at_least_32_chars', JWT_EXPIRES_IN: '7d' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('produces a token that verifies and carries the correct user id', () => {
    const { signToken } = require('../../src/controllers/auth.controller');
    const token = signToken('user_12345');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('user_12345');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it('rejects verification with the wrong secret', () => {
    const { signToken } = require('../../src/controllers/auth.controller');
    const token = signToken('user_12345');
    expect(() => jwt.verify(token, 'a_completely_different_wrong_secret')).toThrow();
  });

  it('rejects an expired token', () => {
    // Build an already-expired token directly (exp in the past) rather than
    // waiting on a real clock — deterministic and doesn't depend on timing.
    const expiredToken = jwt.sign(
      { id: 'user_12345', exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_SECRET
    );
    expect(() => jwt.verify(expiredToken, process.env.JWT_SECRET)).toThrow(jwt.TokenExpiredError);
  });
});
