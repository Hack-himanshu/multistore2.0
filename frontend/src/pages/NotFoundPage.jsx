import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-black text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:-translate-y-0.5 transition-transform"
          >
            Go Home
          </Link>
          <Link
            to="/dashboard"
            className="border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/5 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
