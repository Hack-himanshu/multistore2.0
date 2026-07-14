const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },      // snapshot at order time
    price: { type: Number, required: true },      // snapshot at order time
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    sku: { type: String, default: '' },
    selectedVariant: { type: Object, default: null },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    country: { type: String, required: true },
    zip: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // ── TENANT ISOLATION ──────────────────────────────────────────────────────
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    // ── Order Identity ────────────────────────────────────────────────────────
    orderNumber: {
      type: String,
      required: true,
    },

    // ── Customer ──────────────────────────────────────────────────────────────
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = guest order
    },
    customerEmail: { type: String, required: true },

    // ── Items ─────────────────────────────────────────────────────────────────
    items: [orderItemSchema],

    // ── Pricing ───────────────────────────────────────────────────────────────
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' },

    // ── Coupon ────────────────────────────────────────────────────────────────
    couponCode: { type: String, default: '' },

    // ── Addresses ─────────────────────────────────────────────────────────────
    shippingAddress: { type: shippingAddressSchema, required: true },
    billingAddress: { type: shippingAddressSchema, default: null },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partially_paid', 'refunded', 'failed'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay', 'stripe', 'paypal', 'other'],
      default: 'cod',
    },
    paymentReference: { type: String, default: '' },

    // ── Online payment gateway (provider-agnostic) ────────────────────────────
    // Whichever gateway the store owner has connected (their own account —
    // see Store.paymentSettings). One shared shape works for all of them:
    // gatewayOrderId   → Razorpay order id / Stripe Checkout session id / PayPal order id
    // gatewayPaymentId → Razorpay payment id / Stripe payment_intent id / PayPal capture id
    // verificationRef  → Razorpay signature / Stripe session id (re-verified via API) / PayPal capture id
    paymentGateway: {
      provider: { type: String, enum: ['none', 'razorpay', 'stripe', 'paypal'], default: 'none' },
      gatewayOrderId: { type: String, default: '' },
      gatewayPaymentId: { type: String, default: '' },
      verificationRef: { type: String, default: '' },
    },

    // ── Fulfillment ────────────────────────────────────────────────────────────
    trackingNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    estimatedDelivery: { type: Date, default: null },

    // ── Notes ─────────────────────────────────────────────────────────────────
    customerNote: { type: String, default: '' },
    internalNote: { type: String, default: '' },

    // ── Status History ────────────────────────────────────────────────────────
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────
orderSchema.index({ storeId: 1, status: 1 });
orderSchema.index({ storeId: 1, customerEmail: 1 });
orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });

// ─── Pre-save: Generate order number ─────────────────────────────────────────
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    // Format: MS-{timestamp}{random}
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `MS-${ts}${rand}`;
    this.statusHistory = [{ status: this.status, note: 'Order placed' }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
