import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import { PageLoader } from './components/ui/Spinner';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';

// ── Lazy imports for code splitting ──────────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Dashboard (Phase 3)
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const ProductsPage = lazy(() => import('./pages/dashboard/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/dashboard/OrdersPage'));
const HomepageBuilderPage = lazy(() => import('./pages/dashboard/HomepageBuilderPage'));
const ThemeSettingsPage = lazy(() => import('./pages/dashboard/ThemeSettingsPage'));
const StoreSettingsPage = lazy(() => import('./pages/dashboard/StoreSettingsPage'));
const PaymentSettingsPage = lazy(() => import('./pages/dashboard/PaymentSettingsPage'));

// Admin (Phase 4)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminStores = lazy(() => import('./pages/admin/AdminStores'));

// Storefront (Phase 2)
const StorefrontLayout = lazy(() => import('./pages/storefront/StorefrontLayout'));
const StorefrontHome = lazy(() => import('./pages/storefront/StorefrontHome'));
const StorefrontProducts = lazy(() => import('./pages/storefront/StorefrontProducts'));
const StorefrontProduct = lazy(() => import('./pages/storefront/StorefrontProduct'));
const StorefrontCart = lazy(() => import('./pages/storefront/StorefrontCart'));
const StorefrontCheckout = lazy(() => import('./pages/storefront/StorefrontCheckout'));
const StorefrontCheckoutComplete = lazy(() => import('./pages/storefront/StorefrontCheckoutComplete'));
const StoreNotFound = lazy(() => import('./pages/storefront/StoreNotFound'));

// Error pages
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  const { fetchMe, isAuthenticated } = useAuthStore();

  // Rehydrate user on app load
  useEffect(() => {
    if (localStorage.getItem('ms_token')) {
      fetchMe();
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111827',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            padding: '14px 18px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />

          {/* ── Auth ────────────────────────────────────────────────── */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* ── Store Owner Dashboard ────────────────────────────────── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['StoreOwner']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="homepage-builder" element={<HomepageBuilderPage />} />
            <Route path="theme" element={<ThemeSettingsPage />} />
            <Route path="settings" element={<StoreSettingsPage />} />
            <Route path="settings/payments" element={<PaymentSettingsPage />} />
          </Route>

          {/* ── SuperAdmin Panel ─────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="stores" element={<AdminStores />} />
          </Route>

          {/* ── Public Storefronts ───────────────────────────────────── */}
          <Route path="/store/:storeSlug" element={<StorefrontLayout />}>
            <Route index element={<StorefrontHome />} />
            <Route path="products" element={<StorefrontProducts />} />
            <Route path="products/:productId" element={<StorefrontProduct />} />
            <Route path="cart" element={<StorefrontCart />} />
            <Route path="checkout" element={<StorefrontCheckout />} />
            <Route path="checkout/complete" element={<StorefrontCheckoutComplete />} />
          </Route>
          <Route path="/store-not-found" element={<StoreNotFound />} />

          {/* ── 404 ─────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
