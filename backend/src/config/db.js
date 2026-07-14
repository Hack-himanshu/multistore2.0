const mongoose = require('mongoose');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// FIXED: this used to call process.exit(1) on the very first failed connection
// attempt. That means a transient hiccup — an Atlas free-tier cluster waking
// up from pause, a brief DNS blip during deploy, the DB server restarting for
// a maintenance window — took the entire API down instead of recovering.
// Retries a few times with backoff before actually giving up.
const connectDB = async (retries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB connected: ${conn.connection.host}`);

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Mongoose will attempt to reconnect automatically...');
      });
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      return; // Success — stop retrying
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        console.error('❌ Giving up after all retries. Exiting.');
        process.exit(1);
      }
      await sleep(delayMs * attempt); // linear backoff: 3s, 6s, 9s, 12s...
    }
  }
};

module.exports = connectDB;
