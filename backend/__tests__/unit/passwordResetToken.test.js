const { generatePasswordResetToken, hashPasswordResetToken } = require('../../src/utils/passwordResetToken');

describe('generatePasswordResetToken', () => {
  it('returns a raw token and a hash that are different from each other', () => {
    const { rawToken, tokenHash } = generatePasswordResetToken();
    expect(rawToken).not.toBe(tokenHash);
    expect(rawToken.length).toBeGreaterThan(0);
    expect(tokenHash.length).toBe(64); // SHA-256 hex digest is always 64 chars
  });

  it('produces a different token on every call', () => {
    const a = generatePasswordResetToken();
    const b = generatePasswordResetToken();
    expect(a.rawToken).not.toBe(b.rawToken);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it('hashing the raw token again reproduces the same hash (this is what reset-password verification relies on)', () => {
    const { rawToken, tokenHash } = generatePasswordResetToken();
    expect(hashPasswordResetToken(rawToken)).toBe(tokenHash);
  });
});

describe('hashPasswordResetToken', () => {
  it('is deterministic', () => {
    expect(hashPasswordResetToken('abc123')).toBe(hashPasswordResetToken('abc123'));
  });

  it('a different input produces a different hash', () => {
    expect(hashPasswordResetToken('abc123')).not.toBe(hashPasswordResetToken('abc124'));
  });
});