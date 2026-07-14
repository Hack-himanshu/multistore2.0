const cloudinary = require('../config/cloudinary');

const hasCloudinaryConfig = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const uploadImageBuffer = async (file) => {
  if (!file?.buffer) {
    throw new Error('No image data provided.');
  }

  if (!hasCloudinaryConfig()) {
    const mimeType = file.mimetype || 'image/png';
    const base64 = file.buffer.toString('base64');
    return {
      secure_url: `data:${mimeType};base64,${base64}`,
      source: 'data-url',
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'multistore', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

module.exports = {
  uploadImageBuffer,
  hasCloudinaryConfig,
};
