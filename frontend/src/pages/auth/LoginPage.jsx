import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || null;

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back! 👋');
      const role = result.user?.role;
      if (from) navigate(from, { replace: true });
      else navigate(role === 'SuperAdmin' ? '/admin' : '/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#111827_45%,_#1f2937_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute left-[-5rem] top-[-3rem] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-3rem] right-[-2rem] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/10 p-8 text-white shadow-[0_30px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl lg:p-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-indigo-100">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Your storefront command center
          </div>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Manage your brand from one polished place.</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">Launch products, shape the storefront, and keep every sale moving with a clean, modern control room.</p>

          <div className="mt-8 space-y-3">
            {['Launch products quickly', 'Customize your storefront', 'Track orders and payments'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-sm text-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-indigo-200">✓</span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-md">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/95 p-7 shadow-[0_25px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-8">
            <div className="mb-7 text-center">
              <Link to="/" className="inline-flex items-center justify-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
                  <span className="text-2xl">🏪</span>
                </div>
              </Link>
              <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to manage your store</p>
            </div>

            <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
              <p className="mb-1 font-semibold">Demo credentials</p>
              <p>SuperAdmin: admin@multistore.com / SuperAdmin@123</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input label="Email Address" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} required autoFocus />
              <Input label="Password" name="password" type="password" placeholder="Your password" value={form.password} onChange={handleChange} error={errors.password} required />

              <div className="flex justify-end">
                <button type="button" className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" fullWidth size="lg" loading={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don’t have a store yet?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700">
                Create one free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
