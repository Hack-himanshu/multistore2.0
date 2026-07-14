/**
 * Seed script — creates the SuperAdmin account if it doesn't exist.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seed = async() => {
    await connectDB();

    const email = process.env.SUPERADMIN_EMAIL || 'admin@multistore.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';

    const existing = await User.findOne({ email });
    if (existing) {
        console.log(`✅ SuperAdmin already exists: ${email}`);
        process.exit(0);
    }

    await User.create({
        name: 'Super Admin',
        email,
        password,
        role: 'SuperAdmin',
    });

    console.log(`✅ SuperAdmin created: ${email}`);
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});