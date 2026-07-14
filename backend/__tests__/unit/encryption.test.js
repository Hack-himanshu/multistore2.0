const crypto = require('crypto');

describe('encryption utility (payment gateway secrets at rest)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex') };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('round-trips a secret exactly', () => {
    const { encrypt, decrypt } = require('../../src/utils/encryption');
    const secret = 'sk_live_super_secret_stripe_key_abc123';
    const encrypted = encrypt(secret);
    expect(encrypted).not.toContain(secret); // never store plaintext
    expect(decrypt(encrypted)).toBe(secret);
  });

  it('produces a different ciphertext each time (random IV) even for the same input', () => {
    const { encrypt } = require('../../src/utils/encryption');
    const a = encrypt('same-secret-value');
    const b = encrypt('same-secret-value');
    expect(a).not.toBe(b);
  });

  it('fails closed on tampered ciphertext instead of returning corrupted data', () => {
    const { encrypt, decrypt } = require('../../src/utils/encryption');
    const encrypted = encrypt('rzp_test_secret_key_12345');
    const [iv, authTag, ciphertext] = encrypted.split(':');
    // Flip a character in the ciphertext — GCM's auth tag must catch this.
    const tampered = `${iv}:${authTag}:${ciphertext.slice(0, -2)}${ciphertext.slice(-2) === '00' ? '11' : '00'}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it('fails to decrypt with the wrong key', () => {
    const { encrypt } = require('../../src/utils/encryption');
    const encrypted = encrypt('another-secret');
    jest.resetModules();
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex'); // different key
    const { decrypt: decryptWithWrongKey } = require('../../src/utils/encryption');
    expect(() => decryptWithWrongKey(encrypted)).toThrow();
  });

  it('throws a clear error if ENCRYPTION_KEY is missing or the wrong length', () => {
    jest.resetModules();
    process.env.ENCRYPTION_KEY = 'too-short';
    const { encrypt } = require('../../src/utils/encryption');
    expect(() => encrypt('anything')).toThrow(/ENCRYPTION_KEY/);
  });

  it('rejects encrypting an empty string', () => {
    const { encrypt } = require('../../src/utils/encryption');
    expect(() => encrypt('')).toThrow();
  });
});

describe('maskForDisplay', () => {
  const { maskForDisplay } = require('../../src/utils/encryption');

  it('shows only the last few characters', () => {
    expect(maskForDisplay('rzp_live_abcdef1234')).toBe('•••••••••••••••1234');
  });

  it('fully masks very short values', () => {
    expect(maskForDisplay('ab')).toBe('••••••••');
  });

  it('handles empty/undefined input safely', () => {
    expect(maskForDisplay('')).toBe('••••••••');
    expect(maskForDisplay(undefined)).toBe('••••••••');
  });
});
