import { useState } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { orderService, paymentService } from '../../services/api';
import { useCart } from './StorefrontLayout';
import Input from '../../components/ui/Input';
import { ArrowRightIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';

const RADII = { none: '0px', sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' };

function getPaymentMethods(store) {
  const methods = [{ value: 'cod', label: '💵 Cash on Delivery' }];
  const provider = store?.payment?.provider;
  const labels = {
    razorpay: '💳 Pay Online (Card / UPI / Netbanking)',
    stripe: '💳 Pay Online (Card)',
    paypal: '💳 Pay with PayPal',
  };
  if (provider && provider !== 'none' && labels[provider]) {
    methods.push({ value: provider, label: labels[provider] });
  }
  return methods;
}

let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
};

export default function StorefrontCheckout() {
  const { storeSlug } = useParams();
  const { store, theme } = useOutletContext();
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const radius = RADII[theme.borderRadius] || '10px';
  const paymentMethods = getPaymentMethods(store);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    street: '', city: '', state: '', country: '', zip: '',
    paymentMethod: 'cod', customerNote: '',
  });
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.street.trim()) e.street = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.country.trim()) e.country = 'Required';
    if (!form.zip.trim()) e.zip = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setPlacing(true);
    try {
      const { data } = await orderService.createPublic(storeSlug, {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, selectedVariant: i.variant })),
        shippingAddress: {
          fullName: form.fullName, email: form.email, phone: form.phone,
          street: form.street, city: form.city, state: form.state,
          country: form.country, zip: form.zip,
        },
        customerEmail: form.email,
        paymentMethod: form.paymentMethod,
        customerNote: form.customerNote,
      });

      const order = data.order;

      if (form.paymentMethod === 'cod') {
        clearCart();
        navigate(`/store/${storeSlug}`, { state: { orderSuccess: true, orderNumber: order.orderNumber } });
        toast.success(`Order placed! #${order.orderNumber}`, { duration: 6000, icon: '🎉' });
        return;
      }

      const { data: gatewayOrder } = await paymentService.createGatewayOrder(storeSlug, order._id);

      if (gatewayOrder.provider === 'razorpay') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Could not load the payment gateway. Please check your connection and try again.');
          return;
        }
        const rzp = new window.Razorpay({
          key: gatewayOrder.publicConfig.keyId,
          amount: gatewayOrder.amount,
          currency: gatewayOrder.currency,
          name: store?.name || 'MultiStore',
          description: `Order #${order.orderNumber}`,
          order_id: gatewayOrder.gatewayOrderId,
          prefill: { name: form.fullName, email: form.email, contact: form.phone },
          theme: { color: theme.primaryColor },
          handler: async (response) => {
            try {
              await paymentService.verifyPayment(storeSlug, {
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              clearCart();
              navigate(`/store/${storeSlug}`, { state: { orderSuccess: true, orderNumber: order.orderNumber } });
              toast.success(`Payment received! Order #${order.orderNumber}`, { duration: 6000, icon: '🎉' });
            } catch {
              toast.error('Payment could not be verified. If money was deducted, contact the store — your order is saved as unpaid.');
            }
          },
          modal: {
            ondismiss: () => {
              toast('Payment cancelled. Your order is saved — you can retry payment or contact the store.', { icon: 'ℹ️' });
            },
          },
        });
        rzp.on('payment.failed', () => {
          toast.error('Payment failed. Your order is saved as unpaid — you can retry.');
        });
        rzp.open();
        return;
      }

      if (gatewayOrder.checkoutUrl) {
        window.location.href = gatewayOrder.checkoutUrl;
        return;
      }

      toast.error('Could not start the payment. Please try again or use Cash on Delivery.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mb-4 text-5xl">🛒</div>
        <h2 className="mb-3 text-xl font-bold text-gray-900">Your cart is empty</h2>
        <Link to={`/store/${storeSlug}/products`} className="inline-block rounded-full px-6 py-3 font-bold text-white" style={{ background: theme.primaryColor, borderRadius: '9999px' }}>
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            <TruckIcon className="h-3.5 w-3.5" /> Secure checkout
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-1 text-sm text-gray-500">Fast, safe, and beautifully simple</p>
        </div>
        <div className="rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-600">Step 1 of 2</div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.85fr]">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-gray-200/80 bg-white/90 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${theme.primaryColor}14`, color: theme.primaryColor }}>
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Contact information</h2>
                <p className="text-sm text-gray-500">We’ll use this to confirm your order</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Full Name" value={form.fullName} onChange={e => set('fullName', e.target.value)} error={errors.fullName} required autoFocus />
              </div>
              <Input label="Email Address" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} required />
              <Input label="Phone Number" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-[24px] border border-gray-200/80 bg-white/90 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
            <h2 className="mb-4 text-base font-bold text-gray-900">Shipping address</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Input label="Street Address" value={form.street} onChange={e => set('street', e.target.value)} error={errors.street} required placeholder="123 Main Street, Apt 4B" /></div>
              <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} error={errors.city} required />
              <Input label="State / Province" value={form.state} onChange={e => set('state', e.target.value)} />
              <Input label="Country" value={form.country} onChange={e => set('country', e.target.value)} error={errors.country} required />
              <Input label="ZIP / Postal Code" value={form.zip} onChange={e => set('zip', e.target.value)} error={errors.zip} required />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[24px] border border-gray-200/80 bg-white/90 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
            <h2 className="mb-4 text-base font-bold text-gray-900">Payment method</h2>
            <div className="space-y-2">
              {paymentMethods.map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-3 transition-all" style={form.paymentMethod === value ? { background: `${theme.primaryColor}12`, borderColor: theme.primaryColor } : {}}>
                  <input type="radio" name="paymentMethod" value={value} checked={form.paymentMethod === value} onChange={() => set('paymentMethod', value)} className="h-4 w-4" style={{ accentColor: theme.primaryColor }} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-[24px] border border-gray-200/80 bg-white/90 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Order note (optional)</label>
            <textarea value={form.customerNote} onChange={e => set('customerNote', e.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-gray-300 focus:bg-white" placeholder="Special instructions or delivery preferences..." />
          </motion.div>

          <button type="submit" disabled={placing} className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || '#a855f7'})` }}>
            {placing ? 'Placing order...' : form.paymentMethod !== 'cod' ? `Pay $${subtotal.toFixed(2)}` : `Place order — $${subtotal.toFixed(2)}`} <ArrowRightIcon className="h-4 w-4" />
          </button>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] border border-gray-200/80 bg-white/90 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">Order summary</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.key} className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl" style={{ background: `${theme.primaryColor}12` }}>
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center">🛍️</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">×{item.quantity}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-semibold text-emerald-600">Free</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900"><span>Total</span><span style={{ color: theme.primaryColor }}>${subtotal.toFixed(2)}</span></div>
            </div>

            <div className="mt-5 flex justify-center gap-3 text-xs text-gray-500">
              <span className="rounded-full bg-gray-100 px-2.5 py-1">🔒 SSL protected</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">🚚 Fast delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
