# MultiStore — Viva Q&A Preparation

## Core Multi-Tenancy Questions

---

### Q1: What is multi-tenancy and how does your project implement it?

**A:** Multi-tenancy means multiple users (tenants) share one application and database, but each sees only their own data. In MultiStore, each Store Owner is a tenant. Every sub-resource — products, categories, orders — has a `storeId` field that links it to exactly one store. Every database query always filters by `storeId` from the authenticated user's context (never from the client request body), so one store's data is completely invisible to another store's owner.

---

### Q2: How do you ensure one store owner cannot see or modify another store's products?

**A:** Three layers of protection:

1. **Auth middleware** (`protect`) verifies the JWT and attaches `req.user` — which includes their `storeId`
2. **Every controller query** uses `req.user.storeId` as a filter, never the client-supplied value:
   ```js
   // Owner endpoint
   const products = await Product.find({ storeId: req.user.storeId });
   
   // Even updates use storeId to find the document:
   const product = await Product.findOne({ _id: req.params.id, storeId: req.user.storeId });
   // If _id belongs to another store, findOne returns null → 404
   ```
3. **Compound unique indexes** `{ storeId: 1, slug: 1 }` enforce that data is partitioned at the database level

---

### Q3: How does the public storefront know which store's products to show?

**A:** Via the `resolveStore` middleware. When a customer visits `/store/alex-fashion/products`, the URL parameter `storeSlug` is extracted, the `Store` document is fetched from MongoDB, and attached to `req.store`. The controller then uses `req.store._id` as the storeId filter — not anything from the client. This is the same isolation pattern as the owner routes.

```js
const resolveStore = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.storeSlug, isActive: true });
  req.store = store; // Controller uses req.store._id — cannot be spoofed
  next();
};
```

---

### Q4: Why is the order price validated on the server instead of trusting the client?

**A:** A malicious user could send a checkout request with a price of $0.01 for a $500 product if we trusted client-side prices. In our `createPublicOrder` controller, we fetch each product's price from MongoDB using `storeId + productId`, completely ignoring whatever price the client sends. This also prevents cross-store product ID injection because the query filters by the resolved store's storeId.

---

### Q5: What are compound indexes and why did you use them?

**A:** A compound index in MongoDB is an index on two or more fields together. We use `{ storeId: 1, slug: 1 }` with `unique: true` on both Product and Category models. This means:

1. **Performance** — queries like `Product.find({ storeId: X, slug: 'blue-shirt' })` are O(log n) instead of O(n)
2. **Business rule enforcement** — two products in the SAME store cannot have the same slug, but "blue-shirt" can exist in Store A AND Store B because the uniqueness is per-store

---

### Q6: Explain the JWT authentication flow in your application.

**A:**
1. User sends email + password to `POST /api/auth/login`
2. Server verifies password with bcrypt, creates a JWT signed with `JWT_SECRET` containing the user's `_id`
3. JWT is returned to the client, stored in `localStorage`
4. On subsequent requests, the client sends `Authorization: Bearer <token>`
5. The `protect` middleware extracts and verifies the JWT, fetches the user from MongoDB, and attaches them to `req.user`
6. If the token is expired or tampered, the request is rejected with 401

---

### Q7: How does the theme system work — how does each store look different?

**A:** Each `Store` document has a `themeSettings` JSON field containing `primaryColor`, `secondaryColor`, `fontFamily`, `borderRadius`, `buttonStyle`, etc. When a customer visits a storefront:

1. `StorefrontLayout` fetches the store config via `GET /api/stores/public/:storeSlug`
2. Theme settings are injected as CSS custom properties (`--store-primary`, `--store-font`, etc.) on the root element
3. All storefront components use `style={{ color: 'var(--store-primary)' }}` instead of hardcoded colors
4. Store A can be indigo + Poppins + rounded, Store B can be emerald + Playfair Display + sharp — same codebase, completely different visual identity

---

### Q8: How does the AI assistant know about the store's context?

**A:** Before calling the Anthropic API, we build a system prompt that includes:
- The store's name, business type, and description
- A list of up to 8 existing products (name + price)
- Instructions for what the AI should help with

```js
const systemPrompt = `You are an AI assistant for ${store.name}, 
a ${store.businessType} store. Here are their products: ...`;
```

This gives Claude enough context to give store-specific suggestions — e.g., suggesting red/gold colors for a Jewelry store, or helping write a product description for an Electronics product using relevant technical language.

---

### Bonus: Architecture Questions

**Q: Why Zustand instead of Redux for state management?**
A: Zustand has a much simpler API — no boilerplate reducers/actions — while supporting persistence via middleware. For our use case (auth state + store config), it's significantly less code for the same result.

**Q: How would you scale this to support custom domains per store?**
A: We'd add a `customDomain` field to the Store model, use a reverse proxy (nginx/Cloudflare) to route incoming domains to our app, and resolve the tenant by domain instead of slug in the resolveStore middleware.

**Q: What happens if MongoDB goes down mid-order?**
A: Express's global error handler catches the Mongoose connection error and returns a 503. For production, we'd use transactions (`session.startTransaction()`) to ensure either all writes succeed (user, stock decrement, order) or none do.
