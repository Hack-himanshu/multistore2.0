const { asyncHandler } = require('../middleware/errorHandler');
const Store = require('../models/Store');
const Product = require('../models/Product');

/**
 * Build a system prompt with the store owner's context.
 * Gives Claude (the AI) enough context to give relevant suggestions.
 */
const buildSystemPrompt = (store, recentProducts = []) => {
  const productList = recentProducts.slice(0, 8).map(p => `  - ${p.name} ($${p.price})`).join('\n');

  return `You are an expert AI assistant embedded inside MultiStore, a multi-tenant e-commerce platform.
You are helping the owner of a specific store set up and grow their business. Here is the context for this store:

STORE DETAILS:
- Store Name: ${store.name}
- Business Type: ${store.businessType}
- Description: ${store.description || 'Not set yet'}
- Currency: ${store.currency || 'USD'}
- Published: ${store.isPublished ? 'Yes' : 'No (still in draft)'}

${recentProducts.length > 0 ? `CURRENT PRODUCTS (sample):\n${productList}` : 'PRODUCTS: No products added yet.'}

YOUR CAPABILITIES — you can help with:
1. Writing compelling product descriptions (SEO-optimized, conversion-focused)
2. Suggesting homepage banner and hero section text
3. Generating SEO meta titles and meta descriptions for the store and products
4. Suggesting theme color schemes that match their business type
5. Recommending store name ideas, taglines, and brand messaging
6. Advising on product pricing strategy
7. Writing category names and descriptions
8. General e-commerce growth tips

INSTRUCTIONS:
- Be specific, practical, and direct. No filler or generic advice.
- When writing product descriptions, always include features + benefits + emotional appeal.
- When suggesting colors, provide actual hex codes.
- Keep responses concise and actionable.
- Format your responses clearly with headings when listing multiple items.
- Always tailor your suggestions to the specific business type: ${store.businessType}.`;
};

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
const chat = asyncHandler(async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'AI assistant is not configured. Please add ANTHROPIC_API_KEY to your .env file.',
    });
  }

  const { messages, storeContext } = req.body;

  if (!messages?.length) {
    return res.status(400).json({ success: false, message: 'Messages are required.' });
  }

  // Load store context — use provided context or fetch from DB
  let store;
  try {
    store = await Store.findById(req.user.storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }
  } catch {
    // If store fetch fails, use provided context
    store = storeContext || { name: 'Your Store', businessType: 'Other' };
  }

  // Get recent products for context
  let recentProducts = [];
  try {
    recentProducts = await Product.find({ storeId: req.user.storeId, isActive: true })
      .limit(8)
      .select('name price')
      .lean();
  } catch {}

  const systemPrompt = buildSystemPrompt(store, recentProducts);

  // Validate messages format
  const validMessages = messages
    .filter(m => m.role && m.content && typeof m.content === 'string')
    .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

  if (!validMessages.length) {
    return res.status(400).json({ success: false, message: 'No valid messages provided.' });
  }

  try {
    // ── Non-streaming response (simpler for the frontend) ─────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: validMessages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Anthropic API error:', errData);
      return res.status(502).json({
        success: false,
        message: 'AI service error. Please check your API key and try again.',
        detail: process.env.NODE_ENV === 'development' ? errData : undefined,
      });
    }

    const data = await response.json();
    const message = data.content?.[0]?.text || 'No response generated.';

    res.status(200).json({ success: true, message });

  } catch (err) {
    console.error('AI request failed:', err);
    res.status(502).json({
      success: false,
      message: 'Failed to reach AI service. Please try again.',
    });
  }
});

// ─── POST /api/ai/generate-description ───────────────────────────────────────
// Dedicated endpoint for generating a single product description
const generateDescription = asyncHandler(async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, message: 'AI not configured.' });
  }

  const { productName, category, price, keywords } = req.body;
  if (!productName) {
    return res.status(400).json({ success: false, message: 'Product name is required.' });
  }

  const store = await Store.findById(req.user.storeId).lean();

  const prompt = `Write a compelling, SEO-optimized product description for:
- Product: ${productName}
- Store Type: ${store?.businessType || 'General'}
- Category: ${category || 'General'}
- Price: ${store?.currency || 'USD'} ${price || 'Not specified'}
- Keywords to include: ${keywords?.join(', ') || 'none specified'}

Format: 2-3 sentences of engaging copy + 3-4 bullet points of key features/benefits.
Be specific, benefit-focused, and conversion-optimized.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const description = data.content?.[0]?.text || '';

    res.status(200).json({ success: true, description });
  } catch {
    res.status(502).json({ success: false, message: 'AI generation failed.' });
  }
});

module.exports = { chat, generateDescription };
