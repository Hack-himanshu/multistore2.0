const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { globalLimiter, authLimiter, aiLimiter, checkoutLimiter } = require('./src/middleware/rateLimiters');

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require('./src/routes/auth.routes');
const storeRoutes = require('./src/routes/store.routes');
const productRoutes = require('./src/routes/product.routes');
const { categoryRouter, orderRouter } = require('./src/routes/category-order.routes');
const aiRoutes = require('./src/routes/ai.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const paymentRoutes = require('./src/routes/payment.routes');

const app = express();

// Real deployments (Render, Railway, Vercel, etc.) sit behind a reverse
// proxy, so every request arrives from the proxy's IP with the real client IP
// in X-Forwarded-For. Without this, two things break: (1) req.ip is the same
// proxy IP for every visitor, so express-rate-limit puts everyone in one
// shared bucket — one busy customer rate-limits the entire storefront; and
// (2) express-rate-limit v7 refuses to start in production at all once it
// sees an X-Forwarded-For header without a matching trust proxy setting
// (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR), since blindly trusting that header
// is how IP-based rate limits get spoofed. `1` = trust exactly one hop
// (the platform's own proxy) — right for Render/Railway/Heroku-style setups.
// If you put this behind an extra CDN/proxy layer, bump this accordingly.
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

// Strips any request key starting with '$' or containing '.' from body/query/
// params — defense in depth against NoSQL operator injection (e.g. someone
// sending {"email": {"$ne": null}} trying to bypass a login check).
app.use(mongoSanitize());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
// Silenced under 'test' so Jest output stays readable — this is the standard
// reason to check NODE_ENV==='test' explicitly rather than assuming
// development/production are the only two states.
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'MultiStore API is running ✅',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/orders', orderRouter);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', checkoutLimiter, paymentRoutes);

// ─── 404 + Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
