const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { asyncHandler } = require('../middleware/errorHandler');
const { generatePasswordResetToken, hashPasswordResetToken } = require('../utils/passwordResetToken');
const { sendPasswordResetEmail } = require('../config/email');

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─── Send Token Response ──────────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Creates a new StoreOwner account AND automatically creates their first store
const register = asyncHandler(async (req, res) => {
  const { name, email, password, storeName, businessType } = req.body;

  // 1. Check if email already in use
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  // 2. Create user (password hashed by pre-save hook)
  const user = await User.create({
    name,
    email,
    password,
    role: 'StoreOwner',
  });

  // 3. Generate unique slug for their store
  const slug = await generateUniqueSlug(storeName || `${name}'s Store`);

  // 4. Create their store
  const store = await Store.create({
    name: storeName || `${name}'s Store`,
    slug,
    owner: user._id,
    businessType: businessType || 'Other',
    contactEmail: email,
  });

  // 5. Link store back to user
  user.storeId = store._id;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 201, res);
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  // Find user with password field included
  const user = await User.findOne({ email }).select('+password +passwordChangedAt');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect email or password.',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Contact support.',
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by protect middleware
  const user = await User.findById(req.user._id).populate({
    path: 'storeId',
    select: 'name slug businessType isActive isPublished stats themeSettings',
  });

  res.status(200).json({
    success: true,
    user: {
      ...user.toSafeObject(),
      store: user.storeId,
    },
  });
});

// ─── PATCH /api/auth/update-profile ──────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: updatedUser.toSafeObject(),
  });
});

// ─── PATCH /api/auth/change-password ─────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect.',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters.',
    });
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// ─── POST /api/auth/register-customer ────────────────────────────────────────
const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'Customer',
  });

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 201, res);
});

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return the same generic response whether or not the email exists —
  // otherwise this endpoint becomes a way to check which emails are
  // registered on the platform (user enumeration).
  const genericResponse = {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  };

  if (!user) return res.status(200).json(genericResponse);

  const { rawToken, tokenHash } = generatePasswordResetToken();
  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  } catch (err) {
    // Don't leave a dangling reset token if the email genuinely failed to send.
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw err;
  }

  res.status(200).json(genericResponse);
});

// ─── POST /api/auth/reset-password/:token ────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(422).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const tokenHash = hashPasswordResetToken(req.params.token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: Date.now() }, // 🔑 not expired
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Please request a new one.' });
  }

  user.password = password; // pre-save hook hashes this
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res); // log them straight in — one less step
});

module.exports = { register, login, getMe, updateProfile, changePassword, registerCustomer, signToken, forgotPassword, resetPassword };