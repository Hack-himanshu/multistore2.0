const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadImageBuffer } = require('../utils/uploadImage');

const router = express.Router();

// Store the uploaded file in memory (not on disk) — Render's filesystem is temporary anyway
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// ─── POST /api/upload/image ───────────────────────────────────────────────────
// Accepts a single image file (field name: "image"), uploads it to Cloudinary,
// and returns the public URL to store on the product/store document.
router.post('/image', protect, restrictTo('StoreOwner', 'SuperAdmin'), upload.single('image'), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided.' });
        }

        const result = await uploadImageBuffer(req.file);

        res.status(200).json({
            success: true,
            url: result.secure_url,
            source: result.source || 'cloudinary',
        });
    } catch (err) {
        console.error('Image upload error:', err);
        res.status(500).json({ success: false, message: 'Image upload failed. Please try again.' });
    }
});

module.exports = router;