const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { asyncHandler } = require('../middleware/errorHandler');
const { escapeRegex } = require('../utils/escapeRegex');

// ─── Owner: List orders ───────────────────────────────────────────────────────
const getOrders = asyncHandler(async (req, res) => {
  const storeId = req.user.storeId; // 🔑 TENANT ISOLATION
  const { page = 1, status, search } = req.query;
  const limit = Math.min(Number(req.query.limit) || 20, 100); // 🔑 prevent unbounded queries
  const filter = { storeId }; // 🔑 Always scope by storeId
  if (status) filter.status = status;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { orderNumber: { $regex: safe, $options: 'i' } },
      { customerEmail: { $regex: safe, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    orders,
  });
});

// ─── Owner: Get single order ──────────────────────────────────────────────────
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, storeId: req.user.storeId }) // 🔑
    .populate('customer', 'name email')
    .populate('items.product', 'name images slug');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  res.status(200).json({ success: true, order });
});

// ─── Owner: Update order status ───────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, trackingUrl } = req.body;
  const order = await Order.findOne({ _id: req.params.id, storeId: req.user.storeId }); // 🔑
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  order.statusHistory.push({ status, note: note || '' });

  // COD orders never go through the Razorpay verify step, so they'd otherwise
  // stay paymentStatus:'unpaid' forever and never show up in revenue stats.
  // Cash changes hands on delivery, so that's the moment we count it as paid.
  let justGotPaid = false;
  if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'unpaid') {
    order.paymentStatus = 'paid';
    justGotPaid = true;
  }

  await order.save();

  if (justGotPaid) {
    await Store.findByIdAndUpdate(order.storeId, { $inc: { 'stats.totalRevenue': order.total } });
  }

  res.status(200).json({ success: true, message: 'Order status updated.', order });
});

// ─── Owner: Dashboard stats ───────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const storeId = req.user.storeId; // 🔑
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders,
    pendingOrders,
    monthlyOrders,
    lastMonthOrders,
    revenueAgg,
    lastMonthRevenueAgg,
  ] = await Promise.all([
    Order.countDocuments({ storeId }),
    Order.countDocuments({ storeId, status: 'pending' }),
    Order.countDocuments({ storeId, createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ storeId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Order.aggregate([
      { $match: { storeId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { storeId, paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  // Revenue by day (last 30 days) for chart
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const revenueByDay = await Order.aggregate([
    { $match: { storeId, paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;

  res.status(200).json({
    success: true,
    stats: {
      totalOrders,
      pendingOrders,
      monthlyOrders,
      lastMonthOrders,
      totalRevenue,
      lastMonthRevenue,
      revenueByDay,
    },
  });
});

// ─── Public: Create order ─────────────────────────────────────────────────────
// Called from storefront checkout — storeId comes from resolved store, not client
//
// FIXED (previous version had two real bugs):
//   1. Stock was decremented item-by-item with no rollback — if item #3 in the
//      cart failed validation, items #1 and #2 were already decremented even
//      though no order was ever created. Now the whole thing runs inside a
//      Mongo session/transaction so it's all-or-nothing.
//   2. store.stats.totalRevenue was incremented at order *creation* time, but
//      the dashboard's revenue aggregation only counts paymentStatus:'paid'
//      orders — so the two numbers disagreed for every unpaid COD order.
//      Revenue is now only added to stats when a payment is actually
//      confirmed (Razorpay verification, or COD marked delivered) — see
//      payment.controller.js and updateOrderStatus below.
const createPublicOrder = asyncHandler(async (req, res) => {
  const storeId = req.store._id; // 🔑 From resolveStore middleware — cannot be spoofed
  const { items, shippingAddress, customerEmail, paymentMethod, customerNote, couponCode } = req.body;

  if (!items?.length) {
    return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
  }

  const session = await Product.startSession();

  try {
    let order;

    await session.withTransaction(async () => {
      // Validate and price items from DB (never trust client prices)
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, storeId, isActive: true }).session(session); // 🔑
        if (!product) {
          throw Object.assign(new Error(`Product not found: ${item.productId}`), { statusCode: 400 });
        }
        if (product.trackInventory && product.stock < item.quantity && !product.allowBackorder) {
          throw Object.assign(new Error(`Insufficient stock for: ${product.name}`), { statusCode: 400 });
        }

        const price = product.price;
        subtotal += price * item.quantity;
        orderItems.push({
          product: product._id,
          name: product.name,
          price,
          quantity: item.quantity,
          image: product.images?.[0]?.url || '',
          sku: product.sku,
          selectedVariant: item.selectedVariant || null,
        });

        // Decrement stock — inside the transaction, so it rolls back with everything else
        if (product.trackInventory) {
          await Product.findByIdAndUpdate(
            product._id,
            { $inc: { stock: -item.quantity, totalSold: item.quantity } },
            { session }
          );
        }
      }

      const createdOrders = await Order.create(
        [{
          storeId,
          items: orderItems,
          shippingAddress,
          customerEmail,
          paymentMethod: paymentMethod || 'cod',
          customerNote,
          couponCode,
          subtotal,
          total: subtotal, // Tax/shipping can be added later
          currency: req.store.currency || 'USD',
        }],
        { session }
      );
      order = createdOrders[0];

      // Order count can be tracked immediately — it's just a count, not money.
      // Revenue is intentionally NOT incremented here — see comment above.
      await Store.findByIdAndUpdate(storeId, { $inc: { 'stats.totalOrders': 1 } }, { session });
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: order.total,
        items: order.items,
      },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Could not place order. Please try again.',
    });
  } finally {
    session.endSession();
  }
});

module.exports = { getOrders, getOrder, updateOrderStatus, getDashboardStats, createPublicOrder };
