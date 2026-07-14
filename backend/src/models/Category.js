const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    // ── TENANT ISOLATION ──────────────────────────────────────────────────────
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name must not exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: '', maxlength: 500 },
    image: { type: String, default: '' },
    icon: { type: String, default: '📦' },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // SEO
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound Index: One slug per store ────────────────────────────────────────
categorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
categorySchema.index({ storeId: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
