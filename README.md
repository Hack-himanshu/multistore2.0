# 🏪 MultiStore — Multi-Tenant Store Builder Platform

> **One platform. Unlimited stores. Zero coding for your customers.**

A full-stack, production-grade multi-tenant e-commerce platform built with the MERN stack. Each registered user can create and manage their own isolated online store — with custom theme, products, orders, and an AI assistant — all on one platform.

---

## 📋 Table of Contents

- [Objective](#-objective)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Setup Instructions](#-setup-instructions)
- [Module Breakdown](#-module-breakdown)
- [ER Diagram](#-er-diagram)
- [API Reference](#-api-reference)
- [Multi-Tenancy: How Isolation Works](#-multi-tenancy-how-isolation-works)
- [Demo Tips](#-demo-tips)

---

## 🎯 Objective

MultiStore demonstrates enterprise-level multi-tenancy in a web application — a core concept in modern SaaS architecture. The platform allows:

- Any user to register and instantly get their own online store
- Each store to be fully isolated: different products, orders, theme, homepage
- Customers to shop at public storefronts scoped to each store
- A SuperAdmin to monitor and manage all stores on the platform
- Store Owners to use an integrated AI assistant for content generation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 (Vite) + TailwindCSS + Framer Motion |
| **State Management** | Zustand (with persist middleware) |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) with role-based access |
| **AI Integration** | Anthropic Claude API (claude-sonnet-4-6) |
| **Charts** | Recharts |
| **Security** | Helmet, express-rate-limit, bcryptjs |
| **Validation** | express-validator |

---

## ✨ Features

### Store Owners
- 🏪 **Instant store creation** on registration — unique slug auto-generated
- 🎨 **Theme Customizer** — colors, fonts, border radius, live preview
- 🏠 **Homepage Builder** — toggle 10 sections on/off with inline editing
- 📦 **Product Management** — CRUD with images, variants, inventory, SEO
- 📋 **Order Management** — status updates, tracking, status history
- 📊 **Dashboard Analytics** — revenue chart, order stats, product count
- 🤖 **AI Assistant** — product descriptions, SEO, banner text, theme suggestions

### Customers
- 🛍️ **Dynamic Storefront** per store at `/store/:storeSlug`
- 🎨 **Theme applied from store config** — each store looks unique
- 🔍 **Product listing** with search, category filter, sorting
- 🛒 **Cart & Checkout** — persisted cart, address form, order submission
- 💳 **Bring-your-own payment gateway (Razorpay / Stripe / PayPal)** — each store owner connects their own account in Settings → Payments; money goes directly to them, this platform never touches it. Cash on Delivery always works with zero setup. See CHANGES.md.
- 📱 **Mobile-first design**

### SuperAdmin
- 📊 Platform-wide stats (total stores, users, orders, revenue)
- 🏪 List and manage all stores
- ⚡ Activate / deactivate any store
- 🔍 Filter by business type and status

---

## 🏗️ Architecture

### Multi-Tenancy Pattern

```
Database: Single MongoDB instance
Tenant Key: storeId (ObjectId) on every sub-resource

User → (owns one) → Store
                        ↓
                   Products (storeId field)
                   Categories (storeId field)  
                   Orders (storeId field)

Every query: Model.find({ storeId: req.user.storeId, ... })
```

### Request Flow

```
Client Request
      │
      ▼
Rate Limiter (express-rate-limit)
      │
      ▼
Auth Middleware (protect) → Verifies JWT → Attaches req.user
      │
      ▼
Role Guard (restrictTo) → Checks req.user.role
      │
      ▼
[For public routes] resolveStore → Fetches store by slug → Attaches req.store
      │
      ▼
Controller → All DB queries include storeId from req.user or req.store
      │
      ▼
Response
```

---

## 📁 Folder Structure

```
multistore/
├── backend/
│   ├── server.js                    # Express app, all middleware, route mounting
│   ├── .env.example                 # Environment variables template
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── db.js                # MongoDB connection with reconnect handlers
│       ├── models/
│       │   ├── User.js              # Roles: SuperAdmin, StoreOwner, Customer
│       │   ├── Store.js             # Theme + homepage config (JSON), tenant root
│       │   ├── Product.js           # storeId-scoped, variants, inventory
│       │   ├── Category.js          # storeId-scoped, hierarchical
│       │   └── Order.js             # storeId-scoped, status history, price snapshot
│       ├── middleware/
│       │   ├── auth.js              # protect, restrictTo, resolveStore, requireOwnStore
│       │   └── errorHandler.js      # Global error handler, asyncHandler wrapper
│       ├── controllers/
│       │   ├── auth.controller.js   # Register (creates store atomically), login, profile
│       │   ├── store.controller.js  # Store CRUD, theme, homepage, admin endpoints
│       │   ├── product.controller.js# Full CRUD + public endpoints (storeId-isolated)
│       │   ├── category.controller.js
│       │   ├── order.controller.js  # Orders + dashboard stats + public order creation
│       │   └── ai.controller.js     # Anthropic API integration with store context
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── store.routes.js
│       │   ├── product.routes.js
│       │   ├── category-order.routes.js
│       │   └── ai.routes.js
│       └── utils/
│           ├── generateSlug.js      # Unique slug generation with collision handling
│           └── seed.js              # SuperAdmin seeder
│
└── frontend/
    ├── vite.config.js               # Dev server + /api proxy
    ├── tailwind.config.js           # Brand colors, animations
    └── src/
        ├── App.jsx                  # Router with lazy loading, protected routes
        ├── main.jsx
        ├── index.css                # Global styles, glass utilities
        ├── services/
        │   └── api.js               # Axios instance + all service methods
        ├── context/
        │   ├── authStore.js         # Zustand auth state (persist)
        │   └── storeConfig.js       # Zustand store config state
        ├── components/
        │   ├── ui/                  # Button, Input, Select, Spinner
        │   └── auth/                # ProtectedRoute, GuestRoute
        └── pages/
            ├── LandingPage.jsx      # Public marketing page
            ├── NotFoundPage.jsx
            ├── auth/                # Login, Register
            ├── dashboard/           # DashboardLayout, Home, Products, Orders,
            │                        # HomepageBuilder, ThemeSettings, StoreSettings
            ├── admin/               # AdminLayout, AdminDashboard, AdminStores
            └── storefront/          # StorefrontLayout (theme injection), Home,
                                     # Products, Product, Cart, Checkout, StoreNotFound
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd multistore/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, etc.

# Frontend
cd multistore/frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# now edit .env with your real MongoDB URI, JWT secret, Cloudinary keys, and
# an ENCRYPTION_KEY (generate one with the command in .env.example).
# NEVER commit this file — .gitignore already excludes it. Razorpay/Stripe/
# PayPal are NOT configured here — each store owner connects their own in
# their dashboard (Settings → Payments) after they register.

cd ../frontend
cp .env.example .env
# for local dev you can leave VITE_API_URL blank (the Vite proxy handles it).
# for a real deployment (Vercel etc.) you MUST set VITE_API_URL to your
# deployed backend's URL, or login/every API call will 404. See CHANGES.md.
```

### 3. Seed SuperAdmin

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# API running at http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev
# App running at http://localhost:5173
```

### 5. First Login

- Go to `http://localhost:5173`
- **SuperAdmin**: admin@multistore.com / SuperAdmin@123
- Or register as a new Store Owner

### 6. Running Tests

```bash
cd backend

npm test                # Fast unit tests — no DB needed, run these constantly
npm run test:integration  # Real HTTP + real in-memory MongoDB (needs internet
                           # the first time, to download the mongod binary —
                           # cached after that)
npm run test:all        # Both
```

See `CHANGES.md` for exactly what each test covers and why.

---

## 📦 Module Breakdown

### Auth Module (`/backend/src/controllers/auth.controller.js`)
Handles user registration (automatically creates a store for StoreOwners), login with JWT, profile management, and password change. Supports three roles: SuperAdmin, StoreOwner, Customer. Registration is atomic — user and store are created together.

### Store Module (`/backend/src/models/Store.js`, `store.controller.js`)
The core of multi-tenancy. Each Store document contains the owner reference (the tenant key), a unique slug, theme configuration (colors/fonts/radius as JSON), and homepage section configuration (hero/categories/featured products etc. as JSON). All sub-resources (products, orders, categories) reference this storeId.

### Product Module (`/backend/src/models/Product.js`, `product.controller.js`)
Full CRUD for products, scoped by storeId on every single query. Includes pricing (price/compareAtPrice/costPrice), inventory tracking, image gallery, variants, SEO fields, and flags (featured, bestSeller). Public endpoints are accessible via storeSlug and use the resolveStore middleware.

### Order Module (`/backend/src/models/Order.js`, `order.controller.js`)
Handles order creation (validates products and pricing server-side from DB — never trusts client prices), status management with history tracking, and dashboard statistics aggregation. Public order creation is also storeId-scoped via resolveStore middleware.

### Store Owner Dashboard (`/frontend/src/pages/dashboard/`)
A full React SPA dashboard with sidebar navigation. Includes live revenue charts (Recharts), product CRUD with a modal interface, order management with status updates, homepage section builder (10 toggleable sections with inline editing), theme customizer with live preview, and store settings with SEO and social links.

### SuperAdmin Panel (`/frontend/src/pages/admin/`)
A separate dashboard accessible only to the SuperAdmin role. Shows platform-wide statistics (total stores, users, orders, revenue), lists all stores with filtering by type/status, and allows activating/deactivating any store with one click.

### AI Assistant Module (`/backend/src/controllers/ai.controller.js`)
Integrates Anthropic's Claude API with store-specific context injection. Builds a system prompt with the store's business type, name, and existing products, then proxies the conversation. Also provides a dedicated product description generation endpoint.

---

## 🗃️ ER Diagram

```
┌─────────────────┐        ┌────────────────────────────────────────────┐
│      USER       │        │                   STORE                    │
├─────────────────┤        ├────────────────────────────────────────────┤
│ _id (ObjectId)  │──owns──│ _id (ObjectId)                             │
│ name            │        │ owner (ref: User)  ← TENANT ROOT           │
│ email (unique)  │        │ slug (unique)                              │
│ password (hash) │        │ name                                       │
│ role            │        │ businessType                               │
│ storeId (ref)   │←──link─│ themeSettings (JSON)                       │
│ isActive        │        │ homepageSections (JSON)                    │
└─────────────────┘        │ isActive / isPublished                     │
                            │ stats (cache: totalProducts, totalOrders)  │
                            └──────────────────┬─────────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
         ┌─────────────────┐       ┌──────────────────┐      ┌──────────────────┐
         │    PRODUCT      │       │    CATEGORY       │      │     ORDER        │
         ├─────────────────┤       ├──────────────────┤      ├──────────────────┤
         │ storeId ← 🔑KEY │       │ storeId ← 🔑KEY  │      │ storeId ← 🔑KEY  │
         │ name            │       │ name             │      │ orderNumber      │
         │ slug            │       │ slug             │      │ customer (User)  │
         │ price           │       │ parent (self-ref)│      │ customerEmail    │
         │ stock           │       │ icon             │      │ items[] snapshot │
         │ images[]        │       │ isActive         │      │ total            │
         │ category (ref)  │       └──────────────────┘      │ status           │
         │ variants[]      │                                  │ shippingAddress  │
         │ isFeatured      │                                  │ statusHistory[]  │
         │ isBestSeller    │                                  └──────────────────┘
         └─────────────────┘

🔑 KEY = Tenant Isolation Key. Every query on this model MUST include storeId.
Compound indexes: { storeId: 1, slug: 1 } UNIQUE on Product and Category.
```

---

## 🔌 API Reference

### Auth
```
POST   /api/auth/register            Create StoreOwner + Store (atomic)
POST   /api/auth/login               Returns JWT token
GET    /api/auth/me                  Get current user (with store info)
PATCH  /api/auth/update-profile      Update name / avatar
PATCH  /api/auth/change-password     Change password
POST   /api/auth/register-customer   Register as Customer
```

### Stores
```
GET    /api/stores/my-store             Owner: Get my store
PATCH  /api/stores/my-store             Owner: Update store details
PATCH  /api/stores/my-store/theme       Owner: Update theme
PATCH  /api/stores/my-store/homepage    Owner: Update homepage sections
GET    /api/stores/public/:storeSlug    Public: Get store config
GET    /api/stores/admin/stores         SuperAdmin: List all stores
GET    /api/stores/admin/stats          SuperAdmin: Platform stats
PATCH  /api/stores/admin/stores/:id/toggle-active  SuperAdmin: Toggle store
```

### Products
```
GET    /api/products                       Owner: List my products
GET    /api/products/:id                   Owner: Get one product
POST   /api/products                       Owner: Create product
PATCH  /api/products/:id                   Owner: Update product
DELETE /api/products/:id                   Owner: Delete product
GET    /api/products/public/:storeSlug     Public: List store products
GET    /api/products/public/:storeSlug/:slug  Public: Get product by slug
```

### Categories
```
GET    /api/categories                     Owner: List categories
POST   /api/categories                     Owner: Create
PATCH  /api/categories/:id                 Owner: Update
DELETE /api/categories/:id                 Owner: Delete
GET    /api/categories/public/:storeSlug   Public: Get store categories
```

### Orders
```
GET    /api/orders                         Owner: List orders
GET    /api/orders/:id                     Owner: Get order
PATCH  /api/orders/:id/status              Owner: Update order status
GET    /api/orders/stats/dashboard         Owner: Dashboard stats
POST   /api/orders/public/:storeSlug       Public: Place order
```

### AI Assistant
```
POST   /api/ai/chat                        Owner: Chat with AI
POST   /api/ai/generate-description        Owner: Generate product description
```

### Payments (Razorpay / Stripe / PayPal — per store)
```
GET    /api/stores/my-store/payment-settings          Owner: View connected gateway (masked, no secrets)
PATCH  /api/stores/my-store/payment-settings           Owner: Connect/update their own gateway credentials
POST   /api/payments/public/:storeSlug/create-order    Public: Open an order with whichever gateway this store connected
POST   /api/payments/public/:storeSlug/verify          Public: Verify the payment server-side, mark order paid
```

---

## 🔐 Multi-Tenancy: How Isolation Works

This is the trickiest and most important part of the project.

### The Problem
Thousands of stores live in ONE database. If Store A's owner can see Store B's products, the system is broken and data is leaked.

### The Solution: storeId as Tenant Key

**1. Server-side storeId enforcement:**
```javascript
// ❌ WRONG — trusting client:
const products = await Product.find({ storeId: req.body.storeId });

// ✅ CORRECT — storeId always from auth context:
const products = await Product.find({ storeId: req.user.storeId });
```

**2. Every model has a storeId field with a compound unique index:**
```javascript
productSchema.index({ storeId: 1, slug: 1 }, { unique: true });
// A slug like "blue-shirt" can exist in BOTH store-a AND store-b
// because the compound index makes them unique per store
```

**3. Public routes use resolveStore middleware:**
```javascript
// For /api/products/public/:storeSlug
app.use(resolveStore); // Fetches store from slug → sets req.store
// Controller then uses req.store._id as storeId — cannot be spoofed
```

**4. Order pricing is validated server-side:**
```javascript
// Client sends { productId, quantity }
// Server fetches price from DB — never trusts client price
const product = await Product.findOne({ _id: item.productId, storeId });
const price = product.price; // From DB, not from client
```

---

## 🎬 Demo Tips

1. **Create 2-3 stores** with different business types (Fashion, Electronics, Restaurant)
2. **Apply different themes** to each store — show same platform, different look
3. **Add products** to each store — confirm one store can't see the other's products
4. **Place test orders** via the storefront checkout
5. **Log in as SuperAdmin** to show the platform overview
6. **Try the AI assistant** with a prompt like "Write a product description for a premium silk scarf"
7. **Test isolation**: Log in as Store A's owner, try to access Store B's product — you'll get a 403 or 404

---

## 📄 License

MIT — free for personal and educational use.

---

*Built with ❤️ using the MERN Stack. Phase-by-phase implementation — Phase 0 through Phase 6.*
