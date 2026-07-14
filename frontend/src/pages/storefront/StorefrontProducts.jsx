import { useEffect, useState, useCallback } from 'react';
import { useParams, useOutletContext, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productService, categoryService } from '../../services/api';
import { useCart } from './StorefrontLayout';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Spinner from '../../components/ui/Spinner';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const RADII = { none: '0px', sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' };
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name', label: 'Name A-Z' },
];

export default function StorefrontProducts() {
  const { storeSlug } = useParams();
  const { store, theme } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { addItem } = useCart();
  const radius = RADII[theme.borderRadius] || '10px';

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const featured = searchParams.get('featured') || '';
  const LIMIT = 12;

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setPage(1);
    setSearchParams(next);
  };

  // Local input state for instant typing feedback; the URL (and therefore
  // the actual API call) only updates 300ms after the person stops typing —
  // one API call per pause, not one per keystroke.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearchInput = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearchInput !== search) setParam('search', debouncedSearchInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, sort };
      if (category) params.category = category;
      if (search) params.search = search;
      if (featured) params.featured = featured;
      const [prodRes, catRes] = await Promise.all([
        productService.getPublic(storeSlug, params),
        categories.length === 0 ? categoryService.getPublic(storeSlug) : Promise.resolve({ data: { categories } }),
      ]);
      setProducts(prodRes.data.products);
      setTotal(prodRes.data.total);
      if (categories.length === 0) setCategories(catRes.data.categories);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [storeSlug, page, category, search, sort, featured]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Curated collection</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              {featured === 'true' ? 'Featured products' : category ? categories.find(c => c._id === category)?.name || 'Products' : 'All products'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{total} products found for your storefront</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Browse, filter, and discover the best of your catalog.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:w-64">
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search products..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white" />
          </div>

          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Sort by</p>
            <select value={sort} onChange={e => setParam('sort', e.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {categories.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Category</p>
              <button onClick={() => setParam('category', '')} className={`mb-1 w-full rounded-2xl px-3 py-2 text-left text-sm transition-all ${!category ? 'font-semibold text-white' : 'text-slate-600 hover:bg-slate-100'}`} style={!category ? { background: theme.primaryColor } : {}}>
                All products
              </button>
              {categories.map(cat => (
                <button key={cat._id} onClick={() => setParam('category', cat._id)} className="mb-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-all" style={category === cat._id ? { background: theme.primaryColor, color: 'white' } : { color: '#475569' }}>
                  <span>{cat.icon}</span>{cat.name}
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-[28px] border border-slate-200/80 bg-white/80 shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
              <Spinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200/80 bg-white/80 py-16 text-center shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
              <div className="mb-4 text-5xl">🔍</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No products found</h3>
              <p className="text-sm text-slate-500">Try a different search or category</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, i) => (
                  <motion.div key={product._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1">
                    <Link to={`/store/${storeSlug}/products/${product.slug}`}>
                      <div className="relative overflow-hidden" style={{ paddingBottom: '75%' }}>
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ background: `${theme.primaryColor}10` }}>🛍️</div>
                        )}
                        {product.discountPercent > 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">-{product.discountPercent}%</span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={`/store/${storeSlug}/products/${product.slug}`}>
                        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-80">{product.name}</h3>
                      </Link>
                      <p className="mb-3 text-sm text-slate-500">{product.shortDescription || 'A refined addition to your collection.'}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: theme.primaryColor }}>${product.price.toFixed(2)}</p>
                          {product.compareAtPrice && <p className="text-xs text-slate-400 line-through">${product.compareAtPrice.toFixed(2)}</p>}
                        </div>
                        <button onClick={() => { addItem(product, 1); toast.success('Added!', { icon: '🛒' }); }} className="rounded-full px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90" style={{ background: theme.primaryColor }}>
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} className="h-9 w-9 rounded-full text-sm font-semibold transition-all" style={page === p ? { background: theme.primaryColor, color: 'white' } : { background: '#f3f4f6', color: '#374151' }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
