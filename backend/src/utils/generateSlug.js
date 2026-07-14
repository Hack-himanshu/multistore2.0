const slugify = require('slugify');
const Store = require('../models/Store');

/**
 * Generates a unique store slug from the store name.
 * If the base slug already exists, appends a numeric suffix until unique.
 *
 * @param {string} name - The store name
 * @returns {Promise<string>} - A unique slug
 */
const generateUniqueSlug = async (name) => {
  // Create base slug: lowercase, replace spaces with hyphens, strip special chars
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,      // strips special characters
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  // Keep incrementing suffix until we find a slug not in use
  while (true) {
    const existing = await Store.findOne({ slug });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = { generateUniqueSlug };
