import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const BUSINESS_TYPES = [
  { value: 'Fashion', label: '👗 Fashion & Apparel' },
  { value: 'Electronics', label: '📱 Electronics & Gadgets' },
  { value: 'Furniture', label: '🛋️ Furniture & Home' },
  { value: 'Jewelry', label: '💍 Jewelry & Accessories' },
  { value: 'Cosmetics', label: '💄 Cosmetics & Beauty' },
  { value: 'Restaurant', label: '🍽️ Restaurant & Food' },
  { value: 'Pharmacy', label: '💊 Pharmacy & Health' },
  { value: 'Books', label: '📚 Books & Media' },
  { value: 'Sports', label: '⚽ Sports & Fitness' },
  { value: 'PetStore', label: '🐾 Pet Store' },
  { value: 'DigitalProducts', label: '💻 Digital Products' },
  { value: 'Courses', label: '🎓 Online Courses' },
  { value: 'Agriculture', label: '🌾 Agriculture & Farming' },
  { value: 'Automobile', label: '🚗 Automobile & Parts' },
  { value: 'Grocery', label: '🛒 Grocery & Essentials' },
  { value: 'LuxuryBrands', label: '✨ Luxury Brands' },
  { value: 'Handmade', label: '🎨 Handmade Products' },
  { value: 'B2B', label: '🤝 B2B Store' },
  { value: 'Wholesale', label: '📦 Wholesale' },
  { value: 'Services', label: '🛠️ Services' },
  { value: 'Other', label: '🏪 Other' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    businessType: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.storeName.trim()) e.storeName = 'Store name is required';
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
    const result = await register(form);
    if (result.success) {
      toast.success('Welcome! Your store is ready 🎉');
      const role = result.user?.role;
      navigate(role === 'SuperAdmin' ? '/admin' : '/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.24),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#111827_45%,_#1f2937_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute left-[-4rem] top-[-2rem] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-3rem] right-[-2rem] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/10 p-8 text-white shadow-[0_30px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl lg:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-indigo-100">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Launch with confidence
          </div>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Create a storefront that feels built for business.</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">Set up your store, choose your style, and start selling with a polished experience from day one.</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {['Fast onboarding', 'Multi-tenant setup', 'Theme control'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-sm text-slate-200">
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
              <h2 className="text-2xl font-semibold text-slate-900">Create your store</h2>
              <p className="mt-1 text-sm text-slate-500">Launch your online business in minutes</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input label="Your Name" name="name" type="text" placeholder="e.g. Alex Johnson" value={form.name} onChange={handleChange} error={errors.name} required autoFocus />
              <Input label="Email Address" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} required />
              <Input label="Password" name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} error={errors.password} required />

              <div className="border-t border-slate-100 pt-1">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Store details</p>
                <div className="space-y-4">
                  <Input label="Store Name" name="storeName" type="text" placeholder="e.g. Alex's Fashion Hub" value={form.storeName} onChange={handleChange} error={errors.storeName} required hint="Your store URL will be generated from this" />
                  <Select label="Business Type" name="businessType" options={BUSINESS_TYPES} placeholder="Select your business type" value={form.businessType} onChange={handleChange} />
                </div>
              </div>

              <Button type="submit" fullWidth size="lg" loading={isLoading} className="mt-2">
                {isLoading ? 'Creating your store...' : 'Create Free Store 🚀'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have a store?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700">
                Sign in
              </Link>
            </p>

            <p className="mt-4 text-center text-xs text-slate-400">
              By creating an account you agree to our{' '}
              <span className="cursor-pointer underline">Terms</span> and{' '}
              <span className="cursor-pointer underline">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
