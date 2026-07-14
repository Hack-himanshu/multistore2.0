const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // ── TENANT ISOLATION — every query must include storeId ──────────────────
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    // ── Core Fields ───────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name must not exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Description must not exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      default: '',
      maxlength: [300, 'Short description must not exceed 300 characters'],
    },

    // ── Categorisation ────────────────────────────────────────────────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    tags: [{ type: String, lowercase: true, trim: true }],

    // ── Pricing ───────────────────────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      default: null,
      min: [0, 'Compare-at price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: null,
      min: [0, 'Cost price cannot be negative'],
    },

    // ── Inventory ─────────────────────────────────────────────────────────────
    sku: { type: String, default: '', trim: true },
    barcode: { type: String, default: '', trim: true },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    trackInventory: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 5 },

    // ── Media ─────────────────────────────────────────────────────────────────
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // ── Variants (size, color, etc.) ──────────────────────────────────────────
    hasVariants: { type: Boolean, default: false },
    variants: [
      {
        name: { type: String }, // e.g. "Red / Large"
        sku: { type: String, default: '' },
        price: { type: Number },
        stock: { type: Number, default: 0 },
        attributes: { type: Map, of: String }, // { color: "red", size: "L" }
        image: { type: String, default: '' },
      },
    ],

    // ── SEO ───────────────────────────────────────────────────────────────────
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: [{ type: String }],
    },

    // ── Flags ─────────────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isDigital: { type: Boolean, default: false },
    downloadUrl: { type: String, default: '' },

    // ── Weight & Shipping ─────────────────────────────────────────────────────
    weight: { type: Number, default: 0 }, // in grams
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },

    // ── Stats ─────────────────────────────────────────────────────────────────
    totalSold: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound Indexes for Tenant-Scoped Queries ───────────────────────────────
productSchema.index({ storeId: 1, isActive: 1 });
productSchema.index({ storeId: 1, category: 1 });
productSchema.index({ storeId: 1, isFeatured: 1 });
productSchema.index({ storeId: 1, isBestSeller: 1 });
productSchema.index({ storeId: 1, slug: 1 }, { unique: true });
productSchema.index({ storeId: 1, name: 'text', description: 'text', tags: 'text' });

// ─── Virtual: Is on sale ──────────────────────────────────────────────────────
productSchema.virtual('isOnSale').get(function () {
  return this.compareAtPrice && this.compareAtPrice > this.price;
});

// ─── Virtual: Discount % ──────────────────────────────────────────────────────
productSchema.virtual('discountPercent').get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

// ─── Virtual: In stock ────────────────────────────────────────────────────────
productSchema.virtual('inStock').get(function () {
  if (!this.trackInventory) return true;
  return this.stock > 0 || this.allowBackorder;
});

module.exports = mongoose.model('Product', productSchema);
