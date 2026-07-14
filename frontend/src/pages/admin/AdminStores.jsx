import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { MagnifyingGlassIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const BUSINESS_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'Fashion', label: '👗 Fashion' },
  { value: 'Electronics', label: '📱 Electronics' },
  { value: 'Furniture', label: '🛋️ Furniture' },
  { value: 'Jewelry', label: '💍 Jewelry' },
  { value: 'Cosmetics', label: '💄 Cosmetics' },
  { value: 'Restaurant', label: '🍽️ Restaurant' },
  { value: 'Pharmacy', label: '💊 Pharmacy' },
  { value: 'Books', label: '📚 Books' },
  { value: 'Sports', label: '⚽ Sports' },
  { value: 'DigitalProducts', label: '💻 Digital' },
  { value: 'Other', label: '🏪 Other' },
];

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [toggling, setToggling] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (businessType) params.businessType = businessType;
      if (activeFilter !== '') params.isActive = activeFilter;
      const { data } = await adminService.getAllStores(params);
      setStores(data.stores);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [page, businessType, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (store) => {
    setToggling(store._id);
    try {
      await adminService.toggleStoreActive(store._id);
      toast.success(`Store ${store.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Failed to update store');
    } finally {
      setToggling(null);
    }
  };

  const filteredStores = search
    ? stores.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.includes(search.toLowerCase()) ||
        s.owner?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : stores;

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 rounded-3xl border border-gray-200/80 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-gray-900">All Stores</h1>
        <p className="text-sm text-gray-500 mt-1">{total} stores on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, slug, owner..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <Select
          value={businessType}
          onChange={e => { setBusinessType(e.target.value); setPage(1); }}
          options={BUSINESS_TYPES}
          placeholder="All Types"
          className="w-44"
        />
        <Select
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
          options={[{ value: '', label: 'All Status' }, { value: 'true', label: '✅ Active' }, { value: 'false', label: '⛔ Inactive' }]}
          placeholder="All Status"
          className="w-40"
        />
        <button onClick={load} className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors" title="Refresh">
          <ArrowPathIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : filteredStores.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No stores found</h3>
          <p className="text-sm text-gray-500">Try a different filter</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Store', 'Owner', 'Business Type', 'Stats', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {filteredStores.map((store, i) => (
                      <motion.tr
                        key={store._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Store */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg overflow-hidden shrink-0">
                              {store.logo ? <img src={store.logo} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} /> : '🏪'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 truncate max-w-[140px]">{store.name}</p>
                              <p className="text-xs text-gray-400 font-mono">/{store.slug}</p>
                            </div>
                          </div>
                        </td>
                        {/* Owner */}
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800 text-xs">{store.owner?.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">{store.owner?.email}</p>
                        </td>
                        {/* Type */}
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-600">{store.businessType}</span>
                        </td>
                        {/* Stats */}
                        <td className="px-4 py-4">
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <p>📦 {store.stats?.totalProducts || 0} products</p>
                            <p>🛒 {store.stats?.totalOrders || 0} orders</p>
                            <p className="font-medium text-emerald-600">${(store.stats?.totalRevenue || 0).toFixed(2)}</p>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${store.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {store.isActive ? '● Active' : '○ Inactive'}
                            </span>
                            <br />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${store.isPublished ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                              {store.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </td>
                        {/* Created */}
                        <td className="px-4 py-4">
                          <p className="text-xs text-gray-500">{new Date(store.createdAt).toLocaleDateString()}</p>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/store/${store.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="View Storefront"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleToggleActive(store)}
                              disabled={toggling === store._id}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                                store.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {toggling === store._id ? '...' : store.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</Button>
              <span className="text-sm text-gray-600 px-4">Page {page} of {pages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}>Next →</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
