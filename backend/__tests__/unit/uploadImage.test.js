const { uploadImageBuffer } = require('../../src/utils/uploadImage');

describe('uploadImageBuffer', () => {
  const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const originalApiKey = process.env.CLOUDINARY_API_KEY;
  const originalApiSecret = process.env.CLOUDINARY_API_SECRET;

  afterEach(() => {
    if (originalCloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;

    if (originalApiKey === undefined) delete process.env.CLOUDINARY_API_KEY;
    else process.env.CLOUDINARY_API_KEY = originalApiKey;

    if (originalApiSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = originalApiSecret;
  });

  it('returns a data URL when Cloudinary credentials are missing', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const file = {
      buffer: Buffer.from('test-image-bytes'),
      mimetype: 'image/png',
    };

    const result = await uploadImageBuffer(file);

    expect(result.secure_url).toMatch(/^data:image\/png;base64,/);
    expect(result.secure_url).toContain(Buffer.from('test-image-bytes').toString('base64'));
  });
});
