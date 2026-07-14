import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl mb-6">🏪</div>
        <div className="text-6xl font-black text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-4">
          Oops!
        </div>
        <h1 className="text-2xl font-bold mb-3">Store Not Found</h1>
        <p className="text-gray-400 mb-8 text-balance">
          This store doesn't exist or may have been deactivated. Please check the URL or contact the store owner.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:-translate-y-0.5 transition-transform"
          >
            Go to MultiStore →
          </Link>
          <button
            onClick={() => window.history.back()}
            className="border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/5 transition-colors"
          >
            Go Back
          </button>
        </div>

        <p className="mt-10 text-gray-600 text-sm">
          Want to create your own store?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}
