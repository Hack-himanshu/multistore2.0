const Store = require('../models/Store');
const User = require('../models/User');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── GET /api/stores/my-store ─────────────────────────────────────────────────
// StoreOwner fetches their own store config
const getMyStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.user.storeId).populate('owner', 'name email avatar');

  if (!store) {
    return res.status(404).json({ success: false, message: 'No store found for this account.' });
  }

  res.status(200).json({ success: true, store });
});

// ─── PATCH /api/stores/my-store ──────────────────────────────────────────────
// StoreOwner updates their store details
const updateMyStore = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'description', 'logo', 'favicon', 'businessType',
    'currency', 'language', 'contactEmail', 'phone', 'address',
    'socialLinks', 'seo', 'isPublished',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const store = await Store.findByIdAndUpdate(req.user.storeId, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Store updated successfully.', store });
});

// ─── PATCH /api/stores/my-store/theme ────────────────────────────────────────
// Update theme settings only
const updateTheme = asyncHandler(async (req, res) => {
  const { themeSettings } = req.body;

  const store = await Store.findByIdAndUpdate(
    req.user.storeId,
    { themeSettings },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Theme updated successfully.',
    themeSettings: store.themeSettings,
  });
});

// ─── PATCH /api/stores/my-store/homepage ─────────────────────────────────────
// Update homepage sections config
const updateHomepage = asyncHandler(async (req, res) => {
  const { homepageSections } = req.body;

  const store = await Store.findByIdAndUpdate(
    req.user.storeId,
    { homepageSections },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Homepage updated successfully.',
    homepageSections: store.homepageSections,
  });
});

// ─── GET /api/public/store/:storeSlug ────────────────────────────────────────
// Public: fetch store config for storefront rendering
const getPublicStore = asyncHandler(async (req, res) => {
  // req.store is already resolved by resolveStore middleware
  const store = req.store;

  // Return only public-safe fields
  const provider = store.paymentSettings?.provider || 'none';
  const paymentInfo = { provider };
  // Only the PUBLIC identifiers — never secrets — so checkout knows which
  // widget/SDK to load and with what public key.
  if (provider === 'razorpay') paymentInfo.keyId = store.paymentSettings.razorpay?.keyId || '';
  if (provider === 'stripe') paymentInfo.publishableKey = store.paymentSettings.stripe?.publishableKey || '';
  if (provider === 'paypal') {
    paymentInfo.clientId = store.paymentSettings.paypal?.clientId || '';
    paymentInfo.mode = store.paymentSettings.paypal?.mode || 'sandbox';
  }

  res.status(200).json({
    success: true,
    store: {
      _id: store._id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo: store.logo,
      businessType: store.businessType,
      themeSettings: store.themeSettings,
      homepageSections: store.homepageSections,
      currency: store.currency,
      language: store.language,
      contactEmail: store.contactEmail,
      phone: store.phone,
      address: store.address,
      socialLinks: store.socialLinks,
      seo: store.seo,
      isPublished: store.isPublished,
      payment: paymentInfo,
    },
  });
});

// ─── SuperAdmin: GET /api/admin/stores ───────────────────────────────────────
const getAllStores = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.businessType) filter.businessType = req.query.businessType;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [stores, total] = await Promise.all([
    Store.find(filter)
      .populate('owner', 'name email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Store.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    stores,
  });
});

// ─── SuperAdmin: PATCH /api/admin/stores/:storeId/toggle-active ──────────────
const toggleStoreActive = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.storeId);
  if (!store) {
    return res.status(404).json({ success: false, message: 'Store not found.' });
  }

  store.isActive = !store.isActive;
  await store.save();

  res.status(200).json({
    success: true,
    message: `Store ${store.isActive ? 'activated' : 'deactivated'} successfully.`,
    isActive: store.isActive,
  });
});

// ─── SuperAdmin: GET /api/admin/stats ────────────────────────────────────────
const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalStores, totalUsers, activeStores] = await Promise.all([
    Store.countDocuments(),
    User.countDocuments({ role: { $ne: 'SuperAdmin' } }),
    Store.countDocuments({ isActive: true }),
  ]);

  // Aggregate platform-wide revenue from store stats
  const revenueAgg = await Store.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: '$stats.totalRevenue' }, totalOrders: { $sum: '$stats.totalOrders' } } },
  ]);

  const revenue = revenueAgg[0] || { totalRevenue: 0, totalOrders: 0 };

  res.status(200).json({
    success: true,
    stats: {
      totalStores,
      activeStores,
      totalUsers,
      totalOrders: revenue.totalOrders,
      totalRevenue: revenue.totalRevenue,
    },
  });
});

module.exports = {
  getMyStore,
  updateMyStore,
  updateTheme,
  updateHomepage,
  getPublicStore,
  getAllStores,
  toggleStoreActive,
  getPlatformStats,
};
