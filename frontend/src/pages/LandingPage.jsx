import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRightIcon, BoltIcon, ChartBarIcon, DevicePhoneMobileIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

const features = [
  { icon: '🛍️', title: 'Any Business Type', desc: 'Fashion, Electronics, Food, Services — one platform fits all.' },
  { icon: '🎨', title: 'Theme Customizer', desc: 'Colors, fonts, and layouts fully customizable without code.' },
  { icon: '🤖', title: 'AI Assistant', desc: 'Built-in AI to write product descriptions, SEO, and more.' },
  { icon: '📊', title: 'Real-time Analytics', desc: 'Track revenue, orders, and customers in one dashboard.' },
  { icon: '🔐', title: 'Multi-tenant Security', desc: 'Each store is fully isolated with enterprise-grade security.' },
  { icon: '📱', title: 'Mobile-first Storefronts', desc: 'Beautiful, fast stores that work on any device.' },
];

const storeExamples = [
  { emoji: '👗', label: 'Fashion' },
  { emoji: '📱', label: 'Electronics' },
  { emoji: '💄', label: 'Beauty' },
  { emoji: '🍕', label: 'Food' },
  { emoji: '📚', label: 'Books' },
  { emoji: '🏋️', label: 'Sports' },
  { emoji: '💍', label: 'Jewelry' },
  { emoji: '🌿', label: 'Organic' },
];

const stats = [
  { value: '10k+', label: 'Stores launched' },
  { value: '4.9/5', label: 'Creator satisfaction' },
  { value: '24/7', label: 'Always-on storefronts' },
];

const trustPoints = [
  { title: 'Launch in hours', description: 'Go from idea to storefront without a developer backlog.', icon: BoltIcon },
  { title: 'Built for growth', description: 'Track orders, revenue, and customer behavior in one place.', icon: ChartBarIcon },
  { title: 'Looks premium everywhere', description: 'Responsive themes that feel refined on desktop and mobile.', icon: ShieldCheckIcon },
];

// Lightweight CSS-3D tilt — no three.js, no extra bundle weight, just a
// mousemove handler + CSS perspective/transform. Real depth, near-zero cost.
function useTilt(strength = 12) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(1000px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) scale3d(1.02,1.02,1.02)`,
    });
  };
  const onMouseLeave = () => setStyle({ transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)' });

  return { ref, style, onMouseMove, onMouseLeave };
}

// A floating, layered "store dashboard" made of stacked divs at different
// translateZ depths — reads as a real 3D object once it's tilting, without
// shipping a 3D engine to render three flat rectangles.
function HeroMockup() {
  const tilt = useTilt(10);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7 }}
      className="relative mx-auto mt-16 max-w-3xl"
      style={{ perspective: '1200px' }}
    >
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.15s ease-out', ...tilt.style }}
        className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl shadow-2xl shadow-indigo-950/50 p-6"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 mb-5" style={{ transform: 'translateZ(20px)' }}>
          <span className="w-3 h-3 rounded-full bg-red-400/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>

        {/* Fake dashboard content, layered in Z for depth */}
        <div className="grid grid-cols-3 gap-3 mb-4" style={{ transform: 'translateZ(35px)' }}>
          {[
            { label: 'Revenue', value: '$12,480', color: 'from-emerald-400 to-teal-400' },
            { label: 'Orders', value: '342', color: 'from-indigo-400 to-purple-400' },
            { label: 'Visitors', value: '8.1k', color: 'from-pink-400 to-rose-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[11px] text-gray-400 mb-1">{s.label}</p>
              <p className={`text-lg font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-end gap-2 h-28"
          style={{ transform: 'translateZ(50px)' }}
        >
          {[40, 65, 45, 80, 60, 95, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-400"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* Floating product card, popped furthest forward for the strongest 3D read */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: 'translateZ(80px)' }}
          className="absolute -bottom-6 -right-4 sm:-right-8 w-40 rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl p-3 backdrop-blur-xl"
        >
          <div className="w-full h-16 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-2xl mb-2">🛍️</div>
          <p className="text-xs font-semibold truncate">New Order</p>
          <p className="text-[11px] text-emerald-400">+ $89.00</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FeatureCard({ f, i }) {
  const tilt = useTilt(6);
  return (
    <motion.div
      key={f.title}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.08 }}
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{ transition: 'transform 0.15s ease-out', ...tilt.style }}
      className="bg-white/6 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
    >
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
      <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-lg">🏪</span>
          </div>
          <span className="font-bold text-lg">MultiStore</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5">
            Start Free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-24 px-4">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-20 right-20 w-48 h-48 bg-pink-600/20 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm px-4 py-2 rounded-full mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Multi-tenant Store Platform · 2025
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6"
          >
            Build Your Online Store
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Without Writing Code
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 text-balance"
          >
            One platform, unlimited stores. Every user gets their own isolated storefront with custom theme, products, and AI assistant.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-10"
          >
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-lg font-semibold text-white">{item.value}</p>
                <p className="text-sm text-gray-400">{item.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left backdrop-blur-sm">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-white">{point.title}</p>
                  <p className="mt-1 text-sm text-gray-400">{point.description}</p>
                </div>
              );
            })}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl shadow-indigo-500/30 transition-all hover:-translate-y-1 hover:shadow-indigo-500/50"
            >
              Create Free Store 🚀
            </Link>
            <Link
              to="/store/demo-fashion"
              className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:bg-white/5"
            >
              View Demo Store →
            </Link>
          </motion.div>

          {/* Store type pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {storeExamples.map((s, i) => (
              <span key={s.label} className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 text-sm px-4 py-2 rounded-full hover:bg-white/10 transition-colors cursor-default">
                {s.emoji} {s.label}
              </span>
            ))}
          </motion.div>

          <HeroMockup />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
              <SparklesIcon className="h-4 w-4 text-indigo-300" /> Crafted for modern storefronts
            </div>
            <h2 className="mb-4 text-4xl font-bold">Everything you need to sell online</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              From storefront to analytics, every tool is built in so your brand can feel polished from day one.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-[32px] border border-indigo-400/20 bg-gradient-to-r from-indigo-900/60 via-slate-900/70 to-purple-900/60 p-10 shadow-[0_24px_80px_rgba(99,102,241,0.18)] sm:p-12">
            <h2 className="mb-4 text-4xl font-bold">Ready to launch something that feels premium?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
              Create your store in minutes, keep full control, and present a shopping experience your customers will remember.
            </p>
            <div className="mb-8 flex flex-wrap justify-center gap-3 text-sm text-gray-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">No credit card required</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">No plugins required</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Instant storefront launch</span>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-4 text-lg font-bold text-white shadow-2xl shadow-indigo-500/30 transition-all hover:-translate-y-1 hover:from-indigo-700 hover:to-purple-700"
            >
              Get started for free <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xl">🏪</span>
            <span className="font-semibold">MultiStore</span>
            <span className="text-sm">· Built with MERN Stack</span>
          </div>
          <p className="text-gray-500 text-sm">© 2025 MultiStore Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
