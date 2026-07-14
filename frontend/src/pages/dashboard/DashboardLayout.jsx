import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import useStoreConfig from '../../context/storeConfig';
import {
  HomeIcon, ShoppingBagIcon, ClipboardDocumentListIcon,
  PaintBrushIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
  SparklesIcon, Bars3Icon, XMarkIcon, RectangleGroupIcon,
  ChartBarIcon, ArrowTopRightOnSquareIcon, CreditCardIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon, end: true },
  { path: '/dashboard/products', label: 'Products', icon: ShoppingBagIcon },
  { path: '/dashboard/orders', label: 'Orders', icon: ClipboardDocumentListIcon },
  { path: '/dashboard/homepage-builder', label: 'Homepage Builder', icon: RectangleGroupIcon },
  { path: '/dashboard/theme', label: 'Theme Settings', icon: PaintBrushIcon },
  { path: '/dashboard/settings/payments', label: 'Payment Settings', icon: CreditCardIcon },
  { path: '/dashboard/settings', label: 'Store Settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { store, fetchMyStore } = useStoreConfig();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    fetchMyStore();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex h-full flex-col ${mobile ? 'p-4' : 'p-5'}`}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
          <span className="text-lg">🏪</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{store?.name || 'My Store'}</p>
          <p className="truncate text-xs text-slate-500">/{store?.slug}</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-1.5 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        )}
      </div>

      {store?.slug && (
        <Link to={`/store/${store.slug}`} target="_blank" rel="noopener noreferrer" className="mb-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50">
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          View Storefront
          <span className={`ml-auto h-2 w-2 rounded-full ${store.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </Link>
      )}

      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, label, icon: Icon, end }) => (
          <Link key={path} to={path} onClick={() => mobile && setSidebarOpen(false)} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${isActive(path, end) ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <button onClick={() => setAiOpen(true)} className="mb-3 mt-4 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100">
        <SparklesIcon className="h-5 w-5 text-violet-500" />
        AI Assistant
        <span className="ml-auto rounded-full bg-violet-600 px-1.5 py-0.5 text-xs text-white">AI</span>
      </button>

      <div className="mt-1 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Logout">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_28%),#f8fafc]">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/80 shadow-[10px_0_40px_rgba(15,23,42,0.03)] backdrop-blur-xl lg:flex">
        <Sidebar />
      </aside>

      {/* ── Mobile Sidebar Overlay ────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-40 lg:hidden shadow-2xl"
            >
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 hover:bg-slate-100">
            <Bars3Icon className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-sm">🏪</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">Dashboard</span>
          </div>
          <button onClick={() => setAiOpen(true)} className="rounded-xl p-2 hover:bg-violet-50">
            <SparklesIcon className="h-5 w-5 text-violet-600" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ store, aiOpen, setAiOpen }} />
        </main>
      </div>

      {/* ── AI Assistant (Phase 5 placeholder) ───────────────── */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-white border-l border-gray-100 z-50 shadow-2xl flex flex-col"
          >
            <AIAssistantPanel store={store} onClose={() => setAiOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Assistant Panel (placeholder, full implementation in Phase 5) ─────────
function AIAssistantPanel({ store, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your AI assistant for **${store?.name || 'your store'}**. I can help you write product descriptions, generate SEO titles, suggest theme colors, and much more. What would you like help with?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    '✍️ Write a product description',
    '🎨 Suggest theme colors',
    '🔍 Generate SEO title',
    '📣 Banner text ideas',
  ];

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);

    try {
      const { aiService } = await import('../../services/api');
      const context = { businessType: store?.businessType, storeName: store?.name };
      const { data } = await aiService.chat(
        [...messages, { role: 'user', content: msg }],
        context
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">AI Assistant</p>
          <p className="text-xs text-gray-500">Powered by Claude</p>
        </div>
        <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gray-900 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="shrink-0 text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="px-3 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
