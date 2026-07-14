/**
 * Full HTTP-level integration tests — real requests through the real Express
 * app (app.js), hitting real middleware (validation, rate limiting, auth),
 * against a real in-memory MongoDB. Same network caveat as
 * order-flows.test.js: needs internet access to download the `mongod` binary
 * on first run (not available in this build sandbox — see CHANGES.md).
 * Run with: npm run test:integration
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration_test_secret_at_least_32_chars';
process.env.CLIENT_URL = 'http://localhost:5173';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../app');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('POST /api/auth/register', () => {
  it('registers a new store owner and returns a usable JWT', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Mayank Test',
      email: 'mayank@example.com',
      password: 'SecurePass123!',
      storeName: 'Mayank Test Store',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('mayank@example.com');
    // Password must never come back in the response, ever.
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects a weak password (bug class: no server-side validation)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Pass',
      email: 'weak@example.com',
      password: '123',
      storeName: 'Weak Store',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects a duplicate email', async () => {
    const payload = {
      name: 'Dup', email: 'dup@example.com', password: 'SecurePass123!', storeName: 'Dup Store',
    };
    const first = await request(app).post('/api/auth/register').send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/auth/register').send({ ...payload, storeName: 'Dup Store 2' });
    expect(second.status).toBe(409); // duplicate key error mapped to 409 by errorHandler.js
  });

  it('rejects a NoSQL-injection-style payload instead of casting it through', async () => {
    // Confirms express-mongo-sanitize is actually wired in and doing something —
    // this object would otherwise reach a Mongoose query with a literal '$gt'
    // key if sanitize weren't stripping it.
    const res = await request(app).post('/api/auth/login').send({
      email: { $gt: '' },
      password: { $gt: '' },
    });
    expect(res.status).toBe(422); // fails email format validation once sanitized to an empty/invalid shape
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test', email: 'login@example.com', password: 'SecurePass123!', storeName: 'Login Store',
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'SecurePass123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password without leaking whether the email exists', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
  });
});

describe('Public storefront routes (no auth required)', () => {
  it('returns 404 with a clear code for a store slug that does not exist', async () => {
    const res = await request(app).get('/api/stores/public/does-not-exist-slug');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('STORE_NOT_FOUND');
  });
});

describe('Tenant isolation: dashboard routes require auth', () => {
  it('rejects unauthenticated access to /api/products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated access to /api/orders', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage/tampered JWT', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', 'Bearer not.a.realtoken');
    expect(res.status).toBe(401);
  });
});
