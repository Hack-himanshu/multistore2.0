import { Link, useParams, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './StorefrontLayout';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline';

const RADII = { none: '0px', sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' };

export default function StorefrontCart() {
  const { storeSlug } = useParams();
  const { theme } = useOutletContext();
  const { items, removeItem, updateQty, clearCart } = useCart();
  const radius = RADII[theme.borderRadius] || '10px';
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-black/5 bg-white/80 p-10 text-center shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${theme.primaryColor}14`, color: theme.primaryColor }}>
            <SparklesIcon className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Your cart is waiting for you</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">Add a few favorites and return here for a fast, polished checkout experience.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/store/${storeSlug}/products`} className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || '#a855f7'})`, borderRadius: '9999px' }}>
              Continue shopping <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link to={`/store/${storeSlug}`} className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">Back to home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            <TruckIcon className="h-3.5 w-3.5" /> Fast checkout
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="mt-1 text-sm text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''} ready for checkout</p>
        </div>
        <button onClick={clearCart} className="text-sm font-semibold text-red-500 transition-colors hover:text-red-600">Clear cart</button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.key}
                layout
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                className="flex flex-col gap-4 rounded-[24px] border border-gray-200/80 bg-white/90 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center"
              >
                <div className="h-20 w-full shrink-0 overflow-hidden rounded-2xl sm:w-20" style={{ background: `${theme.primaryColor}12` }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">🛍️</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">{item.name}</h3>
                  {item.variant && <p className="mt-1 text-sm text-gray-500">{Object.values(item.variant).join(' / ')}</p>}
                  <p className="mt-2 font-semibold" style={{ color: theme.primaryColor }}>${item.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                    <button onClick={() => updateQty(item.key, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-gray-600 transition-colors hover:bg-gray-100">−</button>
                    <span className="w-10 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQty(item.key, item.quantity + 1)} className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-gray-600 transition-colors hover:bg-gray-100">+</button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeItem(item.key)} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] border border-gray-200/80 bg-white/90 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${theme.primaryColor}14`, color: theme.primaryColor }}>
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Order Summary</h2>
                <p className="text-sm text-gray-500">Secure and simple</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span style={{ color: theme.primaryColor }}>${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Link to={`/store/${storeSlug}/checkout`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || '#a855f7'})` }}>
              Proceed to checkout <ArrowRightIcon className="h-4 w-4" />
            </Link>

            <Link to={`/store/${storeSlug}/products`} className="mt-3 block text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-700">Continue shopping</Link>

            <div className="mt-5 flex flex-wrap justify-center gap-3 border-t border-gray-200 pt-4 text-xs text-gray-500">
              <span className="rounded-full bg-gray-100 px-2.5 py-1">🔒 Secure checkout</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">📦 Fast dispatch</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">✅ Trusted brand</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
