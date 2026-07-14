import { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productService } from '../../services/api';
import { useCart } from './StorefrontLayout';
import Spinner from '../../components/ui/Spinner';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, TruckIcon } from '@heroicons/react/24/outline';

const RADII = { none: '0px', sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' };

export default function StorefrontProduct() {
  const { storeSlug, productSlug } = useParams();
  const { theme } = useOutletContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();
  const radius = RADII[theme.borderRadius] || '10px';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await productService.getPublicOne(storeSlug, productSlug);
        setProduct(data.product);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeSlug, productSlug]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  if (!product) return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <h2 className="mb-3 text-xl font-bold text-gray-900">Product not found</h2>
      <p className="mb-6 text-gray-500">This product may have been removed or is temporarily unavailable.</p>
      <Link to={`/store/${storeSlug}/products`} className="inline-block rounded-full px-6 py-3 font-semibold text-white" style={{ background: theme.primaryColor }}>
        Browse products
      </Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [{ url: '', alt: product.name }];

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success(`${qty > 1 ? `${qty}× ` : ''}${product.name} added to cart!`, { icon: '🛒' });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <nav className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-gray-500">
        <Link to={`/store/${storeSlug}`} className="transition-colors hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link to={`/store/${storeSlug}/products`} className="transition-colors hover:text-gray-700">Products</Link>
        <span>/</span>
        <span className="font-semibold text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <motion.div key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-[32px] border border-gray-200/80 bg-white/90 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="aspect-square overflow-hidden rounded-[24px]" style={{ background: `${theme.primaryColor}12` }}>
              {images[activeImg]?.url ? (
                <img src={images[activeImg].url} alt={images[activeImg].alt || product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-8xl">🛍️</div>
              )}
            </div>
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition-all" style={{ borderColor: i === activeImg ? theme.primaryColor : 'transparent' }}>
                  {img.url ? <img src={img.url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl">🛍️</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {product.isBestSeller && <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: theme.secondaryColor || '#f59e0b' }}>🔥 Best seller</span>}
            {product.isFeatured && <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: theme.primaryColor }}>⭐ Featured</span>}
            {!product.inStock && <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">Out of stock</span>}
          </div>

          {product.category && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{product.category.name}</p>}
          <h1 className="mb-3 text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="mb-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black" style={{ color: theme.primaryColor }}>${product.price.toFixed(2)}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-600">Save {product.discountPercent}%</span>
              </>
            )}
          </div>

          {product.shortDescription && <p className="mb-6 text-sm leading-7 text-gray-600">{product.shortDescription}</p>}

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
              <div className="mb-1 flex items-center gap-2 font-semibold text-gray-900"><ShieldCheckIcon className="h-4 w-4" style={{ color: theme.primaryColor }} />Secure purchase</div>
              <p className="text-xs text-gray-500">Protected checkout</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
              <div className="mb-1 flex items-center gap-2 font-semibold text-gray-900"><TruckIcon className="h-4 w-4" style={{ color: theme.primaryColor }} />Fast shipping</div>
              <p className="text-xs text-gray-500">Usually dispatched today</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
              <div className="mb-1 flex items-center gap-2 font-semibold text-gray-900"><SparklesIcon className="h-4 w-4" style={{ color: theme.primaryColor }} />Quality assured</div>
              <p className="text-xs text-gray-500">Curated for performance</p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-100">−</button>
              <span className="w-12 text-center text-sm font-semibold text-gray-900">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="flex h-11 w-11 items-center justify-center text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-100">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={!product.inStock} className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || '#a855f7'})` }}>
              Add to cart <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[24px] border border-gray-200 bg-white/80 p-4 text-sm text-gray-600">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Availability</span>
              <span className={`font-semibold ${product.inStock ? 'text-emerald-600' : 'text-red-500'}`}>{product.inStock ? `In stock · ${product.stock} available` : 'Out of stock'}</span>
            </div>
            {(product.sku || product.tags?.length > 0) && (
              <div className="space-y-2 border-t border-gray-200 pt-3 text-xs text-gray-500">
                {product.sku && <p>SKU: {product.sku}</p>}
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => <span key={tag} className="rounded-full border border-gray-200 px-2.5 py-1" style={{ color: theme.primaryColor }}>#{tag}</span>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {product.description && (
        <section className="mt-12 rounded-[28px] border border-gray-200/80 bg-white/80 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Product details</h2>
          <div className="whitespace-pre-line text-sm leading-7 text-gray-600">{product.description}</div>
        </section>
      )}
    </div>
  );
}
