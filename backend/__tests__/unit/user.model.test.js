const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../../src/models/User');

describe('User.comparePassword', () => {
  // We assign an already-hashed password directly rather than calling
  // .save() — the pre-save hashing hook needs a live DB write to trigger,
  // but comparePassword() itself (the method actually used by the login
  // controller) doesn't need a connection at all, so we can test the exact
  // real method in isolation.
  let user;

  beforeAll(async () => {
    const hashed = await bcrypt.hash('CorrectHorseBattery1!', 12);
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashed,
      role: 'StoreOwner',
    });
  });

  it('returns true for the correct password', async () => {
    await expect(user.comparePassword('CorrectHorseBattery1!')).resolves.toBe(true);
  });

  it('returns false for an incorrect password', async () => {
    await expect(user.comparePassword('wrong-password')).resolves.toBe(false);
  });

  it('returns false for an empty string', async () => {
    await expect(user.comparePassword('')).resolves.toBe(false);
  });

  it('is case-sensitive', async () => {
    await expect(user.comparePassword('correcthorsebattery1!')).resolves.toBe(false);
  });
});

describe('User schema validation', () => {
  it('rejects a document missing a required field (email)', () => {
    const user = new User({ name: 'No Email', password: 'hashed', role: 'StoreOwner' });
    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });

  it('rejects an invalid role value', () => {
    const user = new User({
      name: 'Bad Role', email: 'a@b.com', password: 'hashed', role: 'NotARealRole',
    });
    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });

  it('accepts a valid document', () => {
    const user = new User({
      name: 'Valid User', email: 'valid@example.com', password: 'hashed_pw', role: 'StoreOwner',
    });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });
});

afterAll(async () => {
  await mongoose.disconnect().catch(() => {});
});
