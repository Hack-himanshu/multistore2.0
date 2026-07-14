require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');

// ─── Connect Database, then start listening ───────────────────────────────────
connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀  MultiStore API         → http://localhost:${PORT}`);
    console.log(`📊  Environment            → ${process.env.NODE_ENV}`);
    console.log(`🌐  CORS Origin            → ${process.env.CLIENT_URL}`);
    console.log(`🤖  AI Assistant           → ${process.env.ANTHROPIC_API_KEY ? 'Configured ✅' : 'Not configured ⚠️'}`);
    console.log(`💳  Payment Gateways       → Per-store (each owner connects their own Razorpay/Stripe/PayPal — see /dashboard/settings/payments)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
    });
    setTimeout(() => { process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    shutdown('UNHANDLED_REJECTION');
});
