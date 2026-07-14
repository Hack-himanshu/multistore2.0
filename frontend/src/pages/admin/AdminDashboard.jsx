import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import {
  BuildingStorefrontIcon, UsersIcon, CurrencyDollarIcon,
  ClipboardDocumentListIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, label, value, sub, tone = 'bg-gray-900', delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-6"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${tone}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm font-medium text-gray-600">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentStores, setRecentStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, storesRes] = await Promise.all([
          adminService.getPlatformStats(),
          adminService.getAllStores({ limit: 5, page: 1 }),
        ]);
        setStats(statsRes.data.stats);
        setRecentStores(storesRes.data.stores);
      } catch {
        setStats({ totalStores: 0, activeStores: 0, totalUsers: 0, totalOrders: 0, totalRevenue: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const statCards = [
    { icon: BuildingStorefrontIcon, label: 'Total Stores', value: stats.totalStores, sub: `${stats.activeStores} active`, tone: 'bg-gray-900', delay: 0 },
    { icon: UsersIcon, label: 'Total Users', value: stats.totalUsers, sub: 'Store owners & customers', tone: 'bg-emerald-600', delay: 0.08 },
    { icon: ClipboardDocumentListIcon, label: 'Platform Orders', value: stats.totalOrders, tone: 'bg-amber-500', delay: 0.16 },
    { icon: CurrencyDollarIcon, label: 'Platform Revenue', value: `$${(stats.totalRevenue || 0).toFixed(2)}`, sub: 'Across all stores', tone: 'bg-rose-500', delay: 0.24 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-gray-200/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Platform Command Center</p>
              <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
              <p className="text-sm text-gray-500">SuperAdmin Dashboard — All stores & users</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Platform Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6 mb-6"
      >
        <h2 className="text-base font-bold text-gray-900 mb-5">Platform Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Active Stores', value: stats.activeStores, total: stats.totalStores },
            { label: 'Active Rate', value: stats.totalStores ? Math.round((stats.activeStores / stats.totalStores) * 100) + '%' : '—', total: null },
            { label: 'Avg Orders/Store', value: stats.totalStores ? Math.round(stats.totalOrders / stats.totalStores) : 0, total: null },
          ].map(({ label, value, total }) => (
            <div key={label} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {total != null && <p className="text-xs text-gray-400 mt-0.5">of {total} total</p>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Stores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Recently Created Stores</h2>
          <Link to="/admin/stores" className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
        </div>
        {recentStores.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <p className="text-3xl mb-2">🏪</p>
            <p className="text-sm">No stores yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentStores.map((store, i) => (
              <motion.div
                key={store._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                  {store.logo ? <img src={store.logo} alt="" className="w-full h-full object-cover rounded-xl" /> : '🏪'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{store.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${store.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {store.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">/{store.slug} · {store.businessType} · Owner: {store.owner?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{new Date(store.createdAt).toLocaleDateString()}</p>
                  <div className="flex gap-1 mt-1 justify-end">
                    <span className="text-xs text-gray-400">{store.stats?.totalProducts || 0} products</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
