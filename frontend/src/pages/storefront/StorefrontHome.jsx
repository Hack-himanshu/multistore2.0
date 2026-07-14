import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService, categoryService } from '../../services/api';
import { resolveStorePath } from '../../utils/storeLinks';
import { useCart } from './StorefrontLayout';
import toast from 'react-hot-toast';

const RADII = { none: '0px', sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' };

function ProductCard({ product, theme, storeSlug, radius }) {
  const { addItem } = useCart();
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group overflow-hidden"
      style={{
        borderRadius: radius,
        background: 'white',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: `1px solid ${theme.primaryColor}18`
      }}
    >
      <Link to={`/store/${storeSlug}/products/${product.slug}`}>
        <div className="relative overflow-hidden" style={{ paddingBottom: '75%' }}>
          {product.images?.[0]?.url ? (
            <img src={product.images[0].url} alt={product.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ background: `${theme.primaryColor}12` }}>🛍️</div>
          )}
          {product.isOnSale && (
            <span className="absolute top-2 left-2 text-xs font-bold text-white px-2 py-1 rounded-full" style={{ background: '#ef4444' }}>
              -{product.discountPercent}%
            </span>
          )}
          {product.isBestSeller && (
            <span className="absolute top-2 right-2 text-xs font-bold text-white px-2 py-1 rounded-full" style={{ background: theme.secondaryColor || '#f59e0b' }}>🔥 Hot</span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/store/${storeSlug}/products/${product.slug}`}>
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 hover:opacity-75 transition-opacity" style={{ color: theme.textColor }}>{product.name}</h3>
        </Link>
        {product.shortDescription && <p className="text-xs opacity-60 mb-2 line-clamp-2">{product.shortDescription}</p>}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="font-bold text-base" style={{ color: theme.primaryColor }}>${product.price.toFixed(2)}</p>
            {product.compareAtPrice && (
              <p className="text-xs opacity-40 line-through">${product.compareAtPrice.toFixed(2)}</p>
            )}
          </div>
          <button
            onClick={() => { addItem(product, 1); toast.success('Added to cart!', { icon: '🛒' }); }}
            className="text-xs font-semibold text-white px-3 py-2 transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: theme.primaryColor, borderRadius: radius }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function StorefrontHome() {
  const { store, theme } = useOutletContext();
  const { storeSlug } = useParams();
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const sections = store.homepageSections || {};
  const radius = RADII[theme.borderRadius] || '10px';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productService.getPublic(storeSlug, { limit: 8 }),
          categoryService.getPublic(storeSlug),
        ]);
        setProducts(prodRes.data.products);
        setCategories(catRes.data.categories);

        const [featRes, bsRes] = await Promise.all([
          productService.getPublic(storeSlug, { featured: 'true', limit: sections.featuredProducts?.displayCount || 8 }),
          productService.getPublic(storeSlug, { bestSeller: 'true', limit: sections.bestSellers?.displayCount || 4 }),
        ]);
        setFeatured(featRes.data.products);
        setBestSellers(bsRes.data.products);
      } catch {}
    };
    loadData();
  }, [storeSlug]);

  return (
    <div>
      {/* ── Hero Section ─────────────────────────────────────────── */}
      {sections.hero?.enabled && (
        <section
          className="relative overflow-hidden"
          style={{
            background: sections.hero.backgroundType === 'gradient'
              ? `linear-gradient(135deg, ${theme.primaryColor}ee, ${theme.secondaryColor || '#a855f7'}cc)`
              : sections.hero.backgroundImage
                ? `url(${sections.hero.backgroundImage}) center/cover`
                : theme.primaryColor,
            minHeight: '520px',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.35),rgba(0,0,0,0.2))]" />
          <div className="relative z-10 max-w-5xl mx-auto px-4 py-24 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight text-balance">
                {sections.hero.heading || `Welcome to ${store.name}`}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto text-balance">
                {sections.hero.subheading || 'Discover amazing products'}
              </p>
              <Link
                to={resolveStorePath(sections.hero.ctaLink || '/products', storeSlug)}
                className="inline-block font-bold text-base px-8 py-4 shadow-xl hover:-translate-y-1 transition-transform duration-200"
                style={{
                  background: theme.secondaryColor || '#f59e0b',
                  color: '#fff',
                  borderRadius: radius,
                }}
              >
                {sections.hero.ctaText || 'Shop Now'} →
              </Link>
            </motion.div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-white/80">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">⚡ Fast checkout</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">✨ Beautiful storefronts</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">🛒 Mobile-ready shopping</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Categories Section ────────────────────────────────────── */}
      {sections.categories?.enabled && categories.length > 0 && (
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--store-text)' }}>
            {sections.categories.heading || 'Shop by Category'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.slice(0, sections.categories.displayCount || 6).map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={`/store/${storeSlug}/products?category=${cat._id}`}
                  className="flex flex-col items-center gap-2 p-4 text-center hover:shadow-lg transition-all group"
                  style={{ borderRadius: radius, border: `1px solid ${theme.primaryColor}20`, background: `${theme.primaryColor}08` }}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">{cat.icon || '📦'}</div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--store-text)' }}>{cat.name}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────────────────────── */}
      {sections.featuredProducts?.enabled && (
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--store-text)' }}>
              {sections.featuredProducts.heading || 'Featured Products'}
            </h2>
            <Link to={`/store/${storeSlug}/products?featured=true`} className="text-sm font-semibold hover:opacity-75" style={{ color: theme.primaryColor }}>
              View all →
            </Link>
          </div>
          {featured.length === 0 ? (
            <ProductGrid products={products} theme={theme} storeSlug={storeSlug} radius={radius} />
          ) : (
            <ProductGrid products={featured} theme={theme} storeSlug={storeSlug} radius={radius} />
          )}
        </section>
      )}

      {/* ── Best Sellers ──────────────────────────────────────────── */}
      {sections.bestSellers?.enabled && bestSellers.length > 0 && (
        <section className="py-12 px-4" style={{ background: `${theme.primaryColor}06` }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--store-text)' }}>
              {sections.bestSellers.heading || 'Best Sellers'} 🔥
            </h2>
            <ProductGrid products={bestSellers} theme={theme} storeSlug={storeSlug} radius={radius} />
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────── */}
      {sections.testimonials?.enabled && sections.testimonials?.items?.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: 'var(--store-text)' }}>
              {sections.testimonials.heading || 'What Our Customers Say'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sections.testimonials.items.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="p-6" style={{ borderRadius: radius, background: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}20` }}>
                  <div className="flex gap-1 mb-3">
                    {Array(t.rating || 5).fill(0).map((_, j) => <span key={j} className="text-amber-400">⭐</span>)}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 opacity-70">{t.review}</p>
                  <p className="font-semibold text-sm" style={{ color: theme.primaryColor }}>— {t.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ────────────────────────────────────────────── */}
      {sections.newsletter?.enabled && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="p-10" style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}ee, ${theme.secondaryColor || '#a855f7'}bb)`,
              borderRadius: `calc(${radius} * 2)`,
            }}>
              <h2 className="text-2xl font-bold text-white mb-2">{sections.newsletter.heading || 'Stay in the Loop'}</h2>
              <p className="text-white/80 text-sm mb-6">{sections.newsletter.subheading || 'Subscribe for deals and updates'}</p>
              <div className="flex max-w-sm mx-auto gap-2">
                <input type="email" placeholder="you@email.com"
                  className="flex-1 px-4 py-3 text-sm focus:outline-none bg-white/20 text-white placeholder-white/60 border border-white/30"
                  style={{ borderRadius: radius }}
                />
                <button className="font-semibold text-sm px-5 py-3 bg-white hover:-translate-y-0.5 transition-transform"
                  style={{ color: theme.primaryColor, borderRadius: radius }}
                  onClick={() => toast.success('Subscribed! Thank you 🎉')}>
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ProductGrid({ products, theme, storeSlug, radius }) {
  if (!products?.length) return (
    <div className="text-center py-12 opacity-50">
      <p className="text-4xl mb-3">📦</p>
      <p className="text-sm">No products yet</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
      {products.map((product, i) => (
        <motion.div key={product._id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
          <ProductCard product={product} theme={theme} storeSlug={storeSlug} radius={radius} />
        </motion.div>
      ))}
    </div>
  );
}
