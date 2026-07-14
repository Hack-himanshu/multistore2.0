import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon, ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { storeService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

// ─── Cart Context ──────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,

      addItem: (product, quantity = 1, variant = null) => {
        set(state => {
          const key = variant ? `${product._id}-${JSON.stringify(variant)}` : product._id;
          const existing = state.items.find(i => i.key === key);
          if (existing) {
            return { items: state.items.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i) };
          }
          return {
            items: [...state.items, {
              key, productId: product._id, name: product.name, price: product.price,
              image: product.images?.[0]?.url || '', quantity, variant,
            }],
            storeSlug: get().storeSlug,
          };
        });
      },

      removeItem: (key) => set(state => ({ items: state.items.filter(i => i.key !== key) })),
      updateQty: (key, qty) => set(state => ({
        items: qty <= 0 ? state.items.filter(i => i.key !== key) : state.items.map(i => i.key === key ? { ...i, quantity: qty } : i)
      })),
      clearCart: () => set({ items: [] }),
      setStoreSlug: (slug) => set({ storeSlug: slug }),

      get total() { return get().items.reduce((s, i) => s + i.price * i.quantity, 0); },
      get count() { return get().items.reduce((s, i) => s + i.quantity, 0); },
    }),
    { name: 'ms_cart' }
  )
);

// ─── Map borderRadius value → Tailwind/CSS ────────────────────────────────────
const RADII = { none: '0px', sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' };

export default function StorefrontLayout() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const { count, setStoreSlug, clearCart, storeSlug: cartSlug } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await storeService.getPublicStore(storeSlug);
        setStore(data.store);
        // Clear cart if switching stores
        if (cartSlug && cartSlug !== storeSlug) clearCart();
        setStoreSlug(storeSlug);
      } catch (err) {
        if (err.response?.data?.code === 'STORE_NOT_FOUND') {
          navigate('/store-not-found', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-gray-500 text-sm animate-pulse">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const theme = store.themeSettings || {};
  const radius = RADII[theme.borderRadius] || '10px';

  // Inject store theme as CSS custom properties on the root element
  const cssVars = {
    '--store-primary': theme.primaryColor || '#6366f1',
    '--store-secondary': theme.secondaryColor || '#f59e0b',
    '--store-bg': theme.backgroundColor || '#ffffff',
    '--store-text': theme.textColor || '#111827',
    '--store-font': theme.fontFamily || 'Inter',
    '--store-radius': radius,
  };

  return (
    <div
      style={{ ...cssVars, fontFamily: 'var(--store-font)', backgroundColor: 'var(--store-bg)', color: 'var(--store-text)' }}
      className="min-h-screen"
    >
      {/* Announcement Banner */}
      {store.homepageSections?.banner?.enabled && (
        <div
          className="text-center py-2.5 px-4 text-sm font-semibold"
          style={{ backgroundColor: store.homepageSections.banner.bgColor || theme.primaryColor, color: '#fff' }}
        >
          {store.homepageSections.banner.text}
        </div>
      )}

      {/* Storefront Header */}
      <header className="sticky top-0 z-30 border-b border-black/10 backdrop-blur-xl" style={{ backgroundColor: 'rgba(255,255,255,0.84)', boxShadow: '0 8px 30px rgba(15,23,42,0.05)' }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to={`/store/${storeSlug}`} className="flex shrink-0 items-center gap-3">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="h-10 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, var(--store-primary), var(--store-secondary))` }}>
                  {store.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-lg font-bold" style={{ color: 'var(--store-text)' }}>{store.name}</span>
              </div>
            )}
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-black/5 bg-black/[0.03] px-2 py-1.5 text-sm font-medium md:flex">
            <Link to={`/store/${storeSlug}`} className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-white" style={{ color: 'var(--store-text)' }}>
              <HomeIcon className="h-4 w-4" /> Home
            </Link>
            <Link to={`/store/${storeSlug}/products`} className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-white" style={{ color: 'var(--store-text)' }}>
              <ShoppingBagIcon className="h-4 w-4" /> Products
            </Link>
          </nav>

          <Link to={`/store/${storeSlug}/cart`} className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg, var(--store-primary), var(--store-secondary))`, borderRadius: '9999px' }}>
            <ShoppingCartIcon className="h-4 w-4" /> Cart
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                style={{ backgroundColor: 'var(--store-secondary)' }}
              >
                {count}
              </motion.span>
            )}
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <main>
        <Outlet context={{ store, theme }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 mt-16 py-10 px-4" style={{ backgroundColor: `${theme.primaryColor}08` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-base mb-3" style={{ color: 'var(--store-primary)' }}>{store.name}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{store.description || 'Quality products for every need.'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm opacity-70">
                <Link to={`/store/${storeSlug}`} className="hover:opacity-100">Home</Link>
                <Link to={`/store/${storeSlug}/products`} className="hover:opacity-100">Products</Link>
                <Link to={`/store/${storeSlug}/cart`} className="hover:opacity-100">Cart</Link>
              </div>
            </div>
            <div>
              {(store.contactEmail || store.phone) && (
                <>
                  <h4 className="font-semibold text-sm mb-3">Contact</h4>
                  {store.contactEmail && <p className="text-sm opacity-70">{store.contactEmail}</p>}
                  {store.phone && <p className="text-sm opacity-70">{store.phone}</p>}
                </>
              )}
              {store.socialLinks && (
                <div className="flex gap-3 mt-3">
                  {Object.entries(store.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold capitalize"
                      style={{ background: 'var(--store-primary)' }}>
                      {k[0].toUpperCase()}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-black/5 pt-6 text-center text-xs opacity-40">
            © {new Date().getFullYear()} {store.name}. Powered by MultiStore.
          </div>
        </div>
      </footer>
    </div>
  );
}
