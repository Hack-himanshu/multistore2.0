const Product = require('../models/Product');
const Store = require('../models/Store');
const slugify = require('slugify');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── Helper: Generate product slug scoped to store ────────────────────────────
const generateProductSlug = async(name, storeId, excludeId = null) => {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 1;
    while (true) {
        const query = { storeId, slug };
        if (excludeId) query._id = { $ne: excludeId };
        const existing = await Product.findOne(query);
        if (!existing) break;
        slug = `${base}-${counter++}`;
    }
    return slug;
};

// ─── Owner: GET /api/products — list store's products ────────────────────────
const getProducts = asyncHandler(async(req, res) => {
    const storeId = req.user.storeId; // TENANT ISOLATION: only this owner's store
    const { page = 1, search, category, isFeatured, isBestSeller, isActive } = req.query;
    const limit = Math.min(Number(req.query.limit) || 20, 100); // 🔑 prevent unbounded queries

    const filter = { storeId }; // 🔑 ALWAYS scope by storeId
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (isBestSeller !== undefined) filter.isBestSeller = isBestSeller === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    else filter.isActive = true; // default: only active

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
        Product.find(filter)
        .populate('category', 'name slug icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
        Product.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        products,
    });
});

// ─── Owner: GET /api/products/:id ────────────────────────────────────────────
const getProduct = asyncHandler(async(req, res) => {
    // 🔑 Always filter by storeId to prevent cross-tenant access
    const product = await Product.findOne({
        _id: req.params.id,
        storeId: req.user.storeId,
    }).populate('category', 'name slug');

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.status(200).json({ success: true, product });
});

// ─── Owner: POST /api/products ────────────────────────────────────────────────
const createProduct = asyncHandler(async(req, res) => {
    const storeId = req.user.storeId; // 🔑 Force storeId from auth context
    const slug = await generateProductSlug(req.body.name, storeId);

    // Empty string category should be treated as "no category", not cast to ObjectId
    if (req.body.category === '') {
        req.body.category = null;
    }

    const product = await Product.create({
        ...req.body,
        storeId, // Always override — never trust client-provided storeId
        slug,
    });

    // Update store stats
    await Store.findByIdAndUpdate(storeId, { $inc: { 'stats.totalProducts': 1 } });

    res.status(201).json({ success: true, message: 'Product created successfully.', product });
});

// ─── Owner: PATCH /api/products/:id ──────────────────────────────────────────
const updateProduct = asyncHandler(async(req, res) => {
    // 🔑 Find with storeId — no way to edit another store's product
    const product = await Product.findOne({ _id: req.params.id, storeId: req.user.storeId });
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Regenerate slug if name changed
    if (req.body.name && req.body.name !== product.name) {
        req.body.slug = await generateProductSlug(req.body.name, req.user.storeId, product._id);
    }

    // Prevent storeId from being changed
    delete req.body.storeId;

    // Empty string category should be treated as "no category", not cast to ObjectId
    if (req.body.category === '') {
        req.body.category = null;
    }

    const updated = await Product.findByIdAndUpdate(product._id, req.body, {
        new: true,
        runValidators: true,
    }).populate('category', 'name slug');

    res.status(200).json({ success: true, message: 'Product updated.', product: updated });
});

// ─── Owner: DELETE /api/products/:id ─────────────────────────────────────────
const deleteProduct = asyncHandler(async(req, res) => {
    // 🔑 Filter by storeId ensures cross-tenant deletion is impossible
    const product = await Product.findOneAndDelete({
        _id: req.params.id,
        storeId: req.user.storeId,
    });

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await Store.findByIdAndUpdate(req.user.storeId, { $inc: { 'stats.totalProducts': -1 } });

    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
});

// ─── Public: GET /api/products/public/:storeSlug ─────────────────────────────
// Used by storefront — req.store already resolved by resolveStore middleware
const getPublicProducts = asyncHandler(async(req, res) => {
    const { page = 1, search, category, sort = 'createdAt', featured, bestSeller } = req.query;
    const limit = Math.min(Number(req.query.limit) || 20, 100); // 🔑 prevent unbounded queries
    const storeId = req.store._id; // 🔑 From resolveStore middleware

    const filter = { storeId, isActive: true }; // Only active products
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (bestSeller === 'true') filter.isBestSeller = true;

    const sortMap = {
        createdAt: { createdAt: -1 },
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        name: { name: 1 },
        popular: { totalSold: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
        Product.find(filter)
        .populate('category', 'name slug icon')
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-costPrice -internalNote') // Hide sensitive fields from public
        .lean(),
        Product.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        products,
    });
});

// ─── Public: GET /api/products/public/:storeSlug/:productSlug ────────────────
const getPublicProduct = asyncHandler(async(req, res) => {
    const storeId = req.store._id;
    const { productSlug } = req.params;

    const product = await Product.findOne({ storeId, slug: productSlug, isActive: true })
        .populate('category', 'name slug icon')
        .lean();

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Increment view count (fire-and-forget)
    Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec();

    res.status(200).json({ success: true, product });
});

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getPublicProducts,
    getPublicProduct,
};