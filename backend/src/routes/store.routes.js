const express = require('express');
const router = express.Router();

const {
  getMyStore,
  updateMyStore,
  updateTheme,
  updateHomepage,
  getPublicStore,
  getAllStores,
  toggleStoreActive,
  getPlatformStats,
} = require('../controllers/store.controller');
const { getPaymentSettings, updatePaymentSettings } = require('../controllers/paymentSettings.controller');

const { protect, restrictTo, resolveStore } = require('../middleware/auth');

// ─── Store Owner Routes (auth required) ───────────────────────────────────────
router.get('/my-store', protect, restrictTo('StoreOwner'), getMyStore);
router.patch('/my-store', protect, restrictTo('StoreOwner'), updateMyStore);
router.patch('/my-store/theme', protect, restrictTo('StoreOwner'), updateTheme);
router.patch('/my-store/homepage', protect, restrictTo('StoreOwner'), updateHomepage);
router.get('/my-store/payment-settings', protect, restrictTo('StoreOwner'), getPaymentSettings);
router.patch('/my-store/payment-settings', protect, restrictTo('StoreOwner'), updatePaymentSettings);

// ─── SuperAdmin Routes ────────────────────────────────────────────────────────
router.get('/admin/stores', protect, restrictTo('SuperAdmin'), getAllStores);
router.get('/admin/stats', protect, restrictTo('SuperAdmin'), getPlatformStats);
router.patch('/admin/stores/:storeId/toggle-active', protect, restrictTo('SuperAdmin'), toggleStoreActive);

// ─── Public Routes ─────────────────────────────────────────────────────────────
router.get('/public/:storeSlug', resolveStore, getPublicStore);

module.exports = router;
