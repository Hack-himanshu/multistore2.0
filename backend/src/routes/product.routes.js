const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getPublicProducts, getPublicProduct,
} = require('../controllers/product.controller');
const { protect, restrictTo, resolveStore } = require('../middleware/auth');

// ── Owner (protected) ──────────────────────────────────────────────────────────
router.get('/', protect, restrictTo('StoreOwner', 'SuperAdmin'), getProducts);
router.get('/:id', protect, restrictTo('StoreOwner', 'SuperAdmin'), getProduct);
router.post('/', protect, restrictTo('StoreOwner'), createProduct);
router.patch('/:id', protect, restrictTo('StoreOwner'), updateProduct);
router.delete('/:id', protect, restrictTo('StoreOwner'), deleteProduct);

// ── Public storefront ──────────────────────────────────────────────────────────
router.get('/public/:storeSlug', resolveStore, getPublicProducts);
router.get('/public/:storeSlug/:productSlug', resolveStore, getPublicProduct);

module.exports = router;
