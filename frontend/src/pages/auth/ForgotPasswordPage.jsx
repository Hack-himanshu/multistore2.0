import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      // Always show success — the backend intentionally never reveals
      // whether the email exists, so neither should this page.
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="blob w-96 h-96 bg-indigo-400 -top-20 -left-20" />
      <div className="blob w-80 h-80 bg-purple-400 -bottom-10 -right-10 animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Link to="/">
              <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏪</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sent ? "We've sent you a link" : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                If an account exists for <span className="font-semibold text-gray-900">{email}</span>,
                a password reset link is on its way. Check your inbox (and spam folder) —
                it expires in 1 hour.
              </p>
              <Link to="/login" className="text-sm text-indigo-600 font-semibold hover:underline">
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" fullWidth size="lg" loading={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Remembered it?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}