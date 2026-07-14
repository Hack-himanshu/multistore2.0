import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import {
  HomeIcon, BuildingStorefrontIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: HomeIcon, end: true },
  { path: '/admin/stores', label: 'All Stores', icon: BuildingStorefrontIcon },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const isActive = (path, end) => end ? location.pathname === path : location.pathname.startsWith(path);

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-6'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center shrink-0 shadow-lg">
          <ShieldCheckIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">MultiStore Admin</p>
          <p className="text-xs text-rose-600 font-medium">SuperAdmin Panel</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, label, icon: Icon, end }) => (
          <Link
            key={path}
            to={path}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 ${
              isActive(path, end)
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                : 'text-gray-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Back to storefront link */}
      <div className="mt-4 mb-3">
        <Link to="/" className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-500 hover:text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors">
          ← Back to Main Site
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-rose-600 font-medium">SuperAdmin</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 lg:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 bottom-0 w-72 bg-white z-40 lg:hidden shadow-2xl">
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100">
            <Bars3Icon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-sm text-gray-800">Admin Panel</span>
          </div>
          <div className="w-9" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
