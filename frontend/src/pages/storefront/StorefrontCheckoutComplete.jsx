import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { paymentService } from '../../services/api';
import { useCart } from './StorefrontLayout';
import Spinner from '../../components/ui/Spinner';

// Landed here from Stripe Checkout or a PayPal approval redirect. Never trust
// the redirect alone — it just means the customer got *sent back*, not that
// the payment is real. We ask the backend to verify with the actual gateway
// before showing anything as successful.
export default function StorefrontCheckoutComplete() {
  const { storeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed'
  const [orderNumber, setOrderNumber] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get('session_id'); // Stripe
      const paypalToken = searchParams.get('token'); // PayPal

      try {
        const { data } = await paymentService.verifyPayment(storeSlug, {
          ...(sessionId ? { session_id: sessionId } : {}),
          ...(paypalToken ? { paypalOrderId: paypalToken } : {}),
        });
        setOrderNumber(data.order.orderNumber);
        setStatus('success');
        clearCart();
      } catch (err) {
        setMessage(err.response?.data?.message || 'We could not confirm this payment.');
        setStatus('failed');
      }
    };
    verify();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      {status === 'verifying' && (
        <>
          <Spinner size="xl" />
          <p className="text-gray-500 text-sm mt-4 animate-pulse">Confirming your payment...</p>
        </>
      )}

      {status === 'success' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">Payment received!</h2>
          <p className="text-gray-500 text-sm mb-6">Order #{orderNumber} is confirmed.</p>
          <Link to={`/store/${storeSlug}`} className="inline-block font-bold text-white px-6 py-3 rounded-xl bg-gray-900">
            Continue Shopping
          </Link>
        </motion.div>
      )}

      {status === 'failed' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">We couldn't confirm this payment</h2>
          <p className="text-gray-500 text-sm mb-6">{message} If money was deducted, it's safe — contact the store with your order details.</p>
          <button onClick={() => navigate(`/store/${storeSlug}/checkout`)} className="inline-block font-bold text-white px-6 py-3 rounded-xl bg-gray-900">
            Back to Checkout
          </button>
        </motion.div>
      )}
    </div>
  );
}
