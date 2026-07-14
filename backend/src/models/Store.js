const mongoose = require('mongoose');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const themeSettingsSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#f59e0b' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#111827' },
    fontFamily: {
      type: String,
      enum: ['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Montserrat', 'Lato', 'Raleway'],
      default: 'Inter',
    },
    borderRadius: {
      type: String,
      enum: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
      default: 'md',
    },
    headerStyle: {
      type: String,
      enum: ['minimal', 'classic', 'bold', 'transparent'],
      default: 'classic',
    },
    buttonStyle: {
      type: String,
      enum: ['filled', 'outlined', 'ghost', 'gradient'],
      default: 'filled',
    },
    darkMode: { type: Boolean, default: false },
  },
  { _id: false }
);

const heroSectionSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    heading: { type: String, default: 'Welcome to Our Store' },
    subheading: { type: String, default: 'Discover amazing products just for you' },
    ctaText: { type: String, default: 'Shop Now' },
    ctaLink: { type: String, default: '/products' },
    backgroundImage: { type: String, default: '' },
    backgroundType: { type: String, enum: ['image', 'gradient', 'color'], default: 'gradient' },
    alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
  },
  { _id: false }
);

const homepageSectionsSchema = new mongoose.Schema(
  {
    hero: { type: heroSectionSchema, default: () => ({}) },
    banner: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: '🎉 Free shipping on orders over $50' },
      link: { type: String, default: '' },
      bgColor: { type: String, default: '#f59e0b' },
    },
    categories: {
      enabled: { type: Boolean, default: true },
      heading: { type: String, default: 'Shop by Category' },
      displayCount: { type: Number, default: 6 },
    },
    featuredProducts: {
      enabled: { type: Boolean, default: true },
      heading: { type: String, default: 'Featured Products' },
      displayCount: { type: Number, default: 8 },
    },
    bestSellers: {
      enabled: { type: Boolean, default: true },
      heading: { type: String, default: 'Best Sellers' },
      displayCount: { type: Number, default: 4 },
    },
    testimonials: {
      enabled: { type: Boolean, default: false },
      heading: { type: String, default: 'What Our Customers Say' },
      items: [
        {
          name: String,
          review: String,
          rating: { type: Number, min: 1, max: 5, default: 5 },
          avatar: String,
        },
      ],
    },
    newsletter: {
      enabled: { type: Boolean, default: true },
      heading: { type: String, default: 'Stay in the Loop' },
      subheading: { type: String, default: 'Subscribe for deals and updates' },
    },
    brands: {
      enabled: { type: Boolean, default: false },
      heading: { type: String, default: 'Trusted Brands' },
      logos: [{ name: String, imageUrl: String }],
    },
    faq: {
      enabled: { type: Boolean, default: false },
      heading: { type: String, default: 'Frequently Asked Questions' },
      items: [{ question: String, answer: String }],
    },
    blog: {
      enabled: { type: Boolean, default: false },
      heading: { type: String, default: 'Latest from the Blog' },
      displayCount: { type: Number, default: 3 },
    },
  },
  { _id: false }
);

// ─── Main Store Schema ─────────────────────────────────────────────────────────
const storeSchema = new mongoose.Schema(
  {
    // ── Identity ──
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      minlength: [2, 'Store name must be at least 2 characters'],
      maxlength: [80, 'Store name must not exceed 80 characters'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    logo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },

    // ── Ownership — TENANT ISOLATION KEY ──
    // Every query on sub-resources (products, orders) MUST filter by this field
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Business Classification ──
    businessType: {
      type: String,
      enum: [
        'Fashion',
        'Electronics',
        'Furniture',
        'Jewelry',
        'Cosmetics',
        'Restaurant',
        'Pharmacy',
        'Books',
        'Sports',
        'PetStore',
        'DigitalProducts',
        'Courses',
        'Agriculture',
        'Automobile',
        'Grocery',
        'LuxuryBrands',
        'Handmade',
        'B2B',
        'Wholesale',
        'Services',
        'Other',
      ],
      default: 'Other',
    },

    // ── Configuration ──
    themeSettings: {
      type: themeSettingsSchema,
      default: () => ({}),
    },
    homepageSections: {
      type: homepageSectionsSchema,
      default: () => ({}),
    },

    // ── Store Meta ──
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      maxlength: 3,
    },
    language: {
      type: String,
      default: 'en',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zip: { type: String, default: '' },
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },

    // ── SEO ──
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: [{ type: String }],
    },

    // ── Status ──
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },

    // ── Analytics Cache (updated periodically) ──
    stats: {
      totalProducts: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalCustomers: { type: Number, default: 0 },
    },

    // ── Payment Gateway (per-store — each store owner connects THEIR OWN
    // account; money goes directly to them, this platform never touches it) ──
    // Secret fields (keySecretEnc / secretKeyEnc / clientSecretEnc) are always
    // encrypted at rest via src/utils/encryption.js and are stripped from
    // every API response by the toJSON transform below — they should never
    // leave the server in plaintext, not even to the store owner's own
    // dashboard after the first save (re-enter to rotate, same as most
    // payment dashboards handle secret keys).
    paymentSettings: {
      provider: {
        type: String,
        enum: ['none', 'razorpay', 'stripe', 'paypal'],
        default: 'none',
      },
      razorpay: {
        keyId: { type: String, default: '' }, // Safe to expose client-side
        keySecretEnc: { type: String, default: '', select: false },
      },
      stripe: {
        publishableKey: { type: String, default: '' }, // Safe to expose client-side
        secretKeyEnc: { type: String, default: '', select: false },
      },
      paypal: {
        clientId: { type: String, default: '' }, // Safe to expose client-side
        clientSecretEnc: { type: String, default: '', select: false },
        mode: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Defense in depth: even though the *Enc fields are `select: false`,
        // strip them again here in case a query ever does .select('+...')
        // upstream — an encrypted secret should never serialize out, full stop.
        if (ret.paymentSettings) {
          delete ret.paymentSettings.razorpay?.keySecretEnc;
          delete ret.paymentSettings.stripe?.secretKeyEnc;
          delete ret.paymentSettings.paypal?.clientSecretEnc;
        }
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
storeSchema.index({ slug: 1 }, { unique: true });
storeSchema.index({ owner: 1 });
storeSchema.index({ businessType: 1 });
storeSchema.index({ isActive: 1, isPublished: 1 });

// ─── Virtual: Public URL ──────────────────────────────────────────────────────
storeSchema.virtual('publicUrl').get(function () {
  return `/store/${this.slug}`;
});

module.exports = mongoose.model('Store', storeSchema);
