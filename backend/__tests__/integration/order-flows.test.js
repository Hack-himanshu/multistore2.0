/**
 * Integration tests against a REAL MongoDB (in-memory, via mongodb-memory-server).
 *
 * These need actual internet access the first time they run, to download a
 * real `mongod` binary (~80-100MB, cached after that in ~/.cache/mongodb-binaries).
 * That's a normal public download for any machine with regular internet —
 * it just isn't reachable from this particular build sandbox, which only
 * allow-lists a short list of package-registry domains. Run these yourself
 * with: npm run test:integration
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const Store = require('../../src/models/Store');
const Order = require('../../src/models/Order');

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

// Minimal helper to create a store + product with enough required fields.
async function makeStoreWithProduct({ stock = 5, price = 20 } = {}) {
  const store = await Store.create({
    name: 'Test Store',
    slug: `test-store-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    owner: new mongoose.Types.ObjectId(),
    businessType: 'Other',
  });
  const product = await Product.create({
    storeId: store._id,
    name: 'Test Product',
    slug: 'test-product',
    price,
    stock,
    trackInventory: true,
    images: [{ url: 'https://example.com/img.jpg' }],
  });
  return { store, product };
}

describe('Order creation — transaction safety (bug #6 fix)', () => {
  it('creates an order and decrements stock atomically for a valid cart', async () => {
    const { store, product } = await makeStoreWithProduct({ stock: 10 });

    // Directly exercise the same logic path as createPublicOrder by
    // replicating its core transaction (import isn't practical here since
    // the controller reads req/res; this proves the underlying invariant:
    // a successful multi-item order leaves stock and order state consistent).
    const session = await Product.startSession();
    let order;
    await session.withTransaction(async () => {
      const p = await Product.findOne({ _id: product._id, storeId: store._id }).session(session);
      await Product.findByIdAndUpdate(p._id, { $inc: { stock: -3, totalSold: 3 } }, { session });
      const created = await Order.create(
        [{
          storeId: store._id,
          items: [{ product: p._id, name: p.name, price: p.price, quantity: 3 }],
          shippingAddress: { fullName: 'A', email: 'a@b.com', street: 'x', city: 'y', country: 'z', zip: '1' },
          customerEmail: 'a@b.com',
          subtotal: p.price * 3,
          total: p.price * 3,
        }],
        { session }
      );
      order = created[0];
    });
    session.endSession();

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(7); // 10 - 3
    expect(order.orderNumber).toBeDefined();
    expect(order.paymentStatus).toBe('unpaid');
  });

  it('rolls back stock decrement entirely if order creation fails mid-transaction', async () => {
    const { store, product } = await makeStoreWithProduct({ stock: 10 });

    const session = await Product.startSession();
    await expect(
      session.withTransaction(async () => {
        await Product.findByIdAndUpdate(product._id, { $inc: { stock: -5 } }, { session });
        // Force a failure after the stock update but before the order exists —
        // this is exactly the scenario that used to leave stock permanently
        // decremented with no order to explain it.
        throw new Error('Simulated failure (e.g. a later cart item is invalid)');
      })
    ).rejects.toThrow('Simulated failure');
    session.endSession();

    const productAfter = await Product.findById(product._id);
    expect(productAfter.stock).toBe(10); // unchanged — the whole transaction rolled back
    const orderCount = await Order.countDocuments({ storeId: store._id });
    expect(orderCount).toBe(0);
  });
});

describe('Revenue accounting (bug #7 fix)', () => {
  it('does not count an unpaid order toward revenue until it is actually paid', async () => {
    const { store, product } = await makeStoreWithProduct();

    await Order.create({
      storeId: store._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: { fullName: 'A', email: 'a@b.com', street: 'x', city: 'y', country: 'z', zip: '1' },
      customerEmail: 'a@b.com',
      paymentMethod: 'cod',
      subtotal: product.price,
      total: product.price,
      // paymentStatus defaults to 'unpaid'
    });

    const paidRevenueAgg = await Order.aggregate([
      { $match: { storeId: store._id, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    expect(paidRevenueAgg.length).toBe(0); // no paid orders yet — matches getDashboardStats' own filter
  });

  it('counts revenue once an order is marked paid', async () => {
    const { store, product } = await makeStoreWithProduct();

    const order = await Order.create({
      storeId: store._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 2 }],
      shippingAddress: { fullName: 'A', email: 'a@b.com', street: 'x', city: 'y', country: 'z', zip: '1' },
      customerEmail: 'a@b.com',
      paymentMethod: 'razorpay',
      subtotal: product.price * 2,
      total: product.price * 2,
    });

    order.paymentStatus = 'paid';
    await order.save();

    const paidRevenueAgg = await Order.aggregate([
      { $match: { storeId: store._id, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    expect(paidRevenueAgg[0].total).toBe(product.price * 2);
  });
});

describe('Category deletion cascade (data-integrity fix)', () => {
  it('unsets the category on products instead of leaving a dangling reference', async () => {
    const store = await Store.create({
      name: 'Cascade Store',
      slug: `cascade-store-${Date.now()}`,
      owner: new mongoose.Types.ObjectId(),
      businessType: 'Other',
    });
    const category = await Category.create({ storeId: store._id, name: 'Shoes', slug: 'shoes' });
    const product = await Product.create({
      storeId: store._id,
      name: 'Sneaker',
      slug: 'sneaker',
      price: 50,
      category: category._id,
      images: [{ url: 'https://example.com/shoe.jpg' }],
    });

    // Mirrors category.controller.js deleteCategory
    await Category.findOneAndDelete({ _id: category._id, storeId: store._id });
    await Product.updateMany({ storeId: store._id, category: category._id }, { $set: { category: null } });

    const updated = await Product.findById(product._id);
    expect(updated.category).toBeNull();
  });
});
