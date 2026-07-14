const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');

// ─── Protect: Verify JWT and attach req.user ──────────────────────────────────
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header or cookie
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.',
      });
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }

    // 3. Check user still exists
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // 4. Check account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    // 5. Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ success: false, message: 'Password recently changed. Please log in again.' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Role Guard: Restrict access to specified roles ───────────────────────────
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// ─── Resolve Store: Attach store to req from storeSlug param ─────────────────
// Used on all public storefront routes: /api/store/:storeSlug/...
const resolveStore = async (req, res, next) => {
  try {
    const { storeSlug } = req.params;
    if (!storeSlug) {
      return res.status(400).json({ success: false, message: 'Store slug is required.' });
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or is currently unavailable.',
        code: 'STORE_NOT_FOUND',
      });
    }

    // Attach store to request for downstream middleware/controllers
    req.store = store;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Own Store Guard: Ensure StoreOwner is acting on their own store ──────────
// CRITICAL FOR TENANT ISOLATION — must run after protect + resolveStore
const requireOwnStore = async (req, res, next) => {
  try {
    // If SuperAdmin, allow everything
    if (req.user.role === 'SuperAdmin') return next();

    // StoreOwner must own the store they're trying to modify
    const storeId = req.store?._id || req.params.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store context missing.' });
    }

    const userStoreId = req.user.storeId?.toString();
    if (!userStoreId || userStoreId !== storeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this store.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, restrictTo, resolveStore, requireOwnStore };
