import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { orderService } from '../../services/api';
import useStoreConfig from '../../context/storeConfig';
import Spinner from '../../components/ui/Spinner';
import {
  ShoppingBagIcon, ClipboardDocumentListIcon,
  CurrencyDollarIcon, ClockIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm font-medium text-gray-600">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-600 mb-1">{label}</p>
      <p className="text-indigo-600 font-bold">${payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
};

export default function DashboardHome() {
  const { store } = useStoreConfig();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await orderService.getDashboardStats();
        setStats(data.stats);
      } catch {
        // Fallback so the dashboard still renders something sensible if the
        // stats endpoint isn't reachable yet (e.g. brand-new store)
        setStats({
          totalOrders: 0, pendingOrders: 0, monthlyOrders: 0,
          totalRevenue: 0, revenueByDay: [],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      icon: CurrencyDollarIcon,
      label: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      color: 'bg-emerald-50 text-emerald-600',
      delay: 0,
    },
    {
      icon: ClipboardDocumentListIcon,
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      sub: `${stats?.monthlyOrders || 0} this month`,
      color: 'bg-indigo-50 text-indigo-600',
      delay: 0.08,
    },
    {
      icon: ClockIcon,
      label: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      color: 'bg-amber-50 text-amber-600',
      delay: 0.16,
    },
    {
      icon: ShoppingBagIcon,
      label: 'Products',
      value: store?.stats?.totalProducts || 0,
      color: 'bg-purple-50 text-purple-600',
      delay: 0.24,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-gray-200/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm mb-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Store Overview</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                {store?.name ? `Welcome to ${store.name} 👋` : 'Dashboard'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Here's what's happening with your store today.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white text-sm font-medium shadow-lg">
              {store?.isPublished ? 'Live storefront is active' : 'Publish your storefront to go live'}
            </div>
          </div>
        </motion.div>

        {/* Store status banner */}
        {store && !store.isPublished && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
          >
            <span className="text-amber-500">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Your store is not published yet</p>
              <p className="text-xs text-amber-600">Customers can't see your store until you publish it.</p>
            </div>
            <Link
              to="/dashboard/settings"
              className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Publish Store
            </Link>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Revenue (Last 30 Days)</h2>
            <p className="text-xs text-gray-500 mt-0.5">Daily revenue from paid orders</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            Revenue Trend
          </div>
        </div>

        {stats?.revenueByDay?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.revenueByDay} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#revenueGradient)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#6366f1' }}
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <CurrencyDollarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No revenue data yet</p>
            <p className="text-xs">Your first orders will appear here</p>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { to: '/dashboard/products', label: 'Add Product', icon: '➕', desc: 'List a new product' },
          { to: '/dashboard/homepage-builder', label: 'Edit Homepage', icon: '🏠', desc: 'Customize sections' },
          { to: '/dashboard/theme', label: 'Change Theme', icon: '🎨', desc: 'Update colors & fonts' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="card p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{action.icon}</div>
            <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
