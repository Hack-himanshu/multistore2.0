const express = require('express');
const { protect, restrictTo, resolveStore } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiters');
const {
  getCategories, createCategory, updateCategory, deleteCategory, getPublicCategories,
} = require('../controllers/category.controller');
const {
  getOrders, getOrder, updateOrderStatus, getDashboardStats, createPublicOrder,
} = require('../controllers/order.controller');

// ── Category Router ────────────────────────────────────────────────────────────
const categoryRouter = express.Router();
categoryRouter.get('/', protect, restrictTo('StoreOwner', 'SuperAdmin'), getCategories);
categoryRouter.post('/', protect, restrictTo('StoreOwner'), createCategory);
categoryRouter.patch('/:id', protect, restrictTo('StoreOwner'), updateCategory);
categoryRouter.delete('/:id', protect, restrictTo('StoreOwner'), deleteCategory);
categoryRouter.get('/public/:storeSlug', resolveStore, getPublicCategories);

// ── Order Router ───────────────────────────────────────────────────────────────
const orderRouter = express.Router();
orderRouter.get('/', protect, restrictTo('StoreOwner', 'SuperAdmin'), getOrders);
orderRouter.get('/stats/dashboard', protect, restrictTo('StoreOwner'), getDashboardStats);
orderRouter.get('/:id', protect, restrictTo('StoreOwner', 'SuperAdmin'), getOrder);
orderRouter.patch('/:id/status', protect, restrictTo('StoreOwner'), updateOrderStatus);
orderRouter.post('/public/:storeSlug', checkoutLimiter, resolveStore, createPublicOrder);

module.exports = { categoryRouter, orderRouter };
