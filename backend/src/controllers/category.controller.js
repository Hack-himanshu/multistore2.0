const Category = require('../models/Category');
const Product = require('../models/Product');
const slugify = require('slugify');
const { asyncHandler } = require('../middleware/errorHandler');

const genSlug = async (name, storeId, excludeId = null) => {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base, counter = 1;
  while (true) {
    const q = { storeId, slug };
    if (excludeId) q._id = { $ne: excludeId };
    const ex = await Category.findOne(q);
    if (!ex) break;
    slug = `${base}-${counter++}`;
  }
  return slug;
};

// ─── Owner: List categories ───────────────────────────────────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const storeId = req.user.storeId; // 🔑 TENANT ISOLATION
  const cats = await Category.find({ storeId }).sort({ order: 1, name: 1 }).lean();
  res.status(200).json({ success: true, categories: cats });
});

// ─── Owner: Create category ───────────────────────────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const storeId = req.user.storeId; // 🔑 Force storeId from auth
  const slug = await genSlug(req.body.name, storeId);
  const cat = await Category.create({ ...req.body, storeId, slug });
  res.status(201).json({ success: true, category: cat });
});

// ─── Owner: Update category ───────────────────────────────────────────────────
const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ _id: req.params.id, storeId: req.user.storeId }); // 🔑
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });
  if (req.body.name && req.body.name !== cat.name) {
    req.body.slug = await genSlug(req.body.name, req.user.storeId, cat._id);
  }
  delete req.body.storeId;
  const updated = await Category.findByIdAndUpdate(cat._id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, category: updated });
});

// ─── Owner: Delete category ───────────────────────────────────────────────────
const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOneAndDelete({ _id: req.params.id, storeId: req.user.storeId }); // 🔑
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });

  // Products pointing at this category shouldn't just silently lose their
  // category with no trace — explicitly unset it so it shows as "Uncategorized"
  // in the dashboard instead of a dangling reference nobody can explain.
  await Product.updateMany({ storeId: req.user.storeId, category: cat._id }, { $set: { category: null } });

  res.status(200).json({ success: true, message: 'Category deleted.' });
});

// ─── Public: Get categories for a store ───────────────────────────────────────
const getPublicCategories = asyncHandler(async (req, res) => {
  const storeId = req.store._id; // From resolveStore middleware
  const cats = await Category.find({ storeId, isActive: true }).sort({ order: 1, name: 1 }).lean();
  res.status(200).json({ success: true, categories: cats });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, getPublicCategories };
