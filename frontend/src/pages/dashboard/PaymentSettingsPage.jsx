import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { paymentSettingsService } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { ShieldCheckIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const PROVIDERS = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    blurb: 'Cards, UPI, netbanking — the most common choice for Indian customers.',
    emoji: '🇮🇳',
    fields: [
      { key: 'keyId', label: 'Key ID', placeholder: 'rzp_live_••••••••', type: 'text', prefix: 'rzp_' },
      { key: 'keySecret', label: 'Key Secret', placeholder: 'Paste your Key Secret', type: 'password', secret: true },
    ],
    docsUrl: 'https://dashboard.razorpay.com/app/keys',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    blurb: 'Cards worldwide — the standard choice for international customers.',
    emoji: '🌍',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_••••••••', type: 'text', prefix: 'pk_' },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'Paste your Secret Key', type: 'password', secret: true },
    ],
    docsUrl: 'https://dashboard.stripe.com/apikeys',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    blurb: 'Widely recognized worldwide — a familiar option for global buyers.',
    emoji: '💰',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Paste your Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'Paste your Client Secret', type: 'password', secret: true },
    ],
    modeToggle: true,
    docsUrl: 'https://developer.paypal.com/dashboard/applications',
  },
];

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [selected, setSelected] = useState('none');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await paymentSettingsService.get();
        setSettings(data.paymentSettings);
        setSelected(data.paymentSettings.provider || 'none');
      } catch {
        toast.error('Could not load payment settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (selected === 'none') {
      setSaving(true);
      try {
        await paymentSettingsService.update({ provider: 'none' });
        toast.success('Online payments turned off — Cash on Delivery still works.');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Save failed.');
      } finally {
        setSaving(false);
      }
      return;
    }

    const provider = PROVIDERS.find((p) => p.id === selected);
    const payload = { provider: selected };
    payload[selected] = {};
    for (const field of provider.fields) {
      if (form[field.key]) payload[selected][field.key] = form[field.key];
    }
    if (provider.modeToggle) payload[selected].mode = form.mode || 'sandbox';

    setSaving(true);
    try {
      const { data } = await paymentSettingsService.update(payload);
      setSettings(data.paymentSettings);
      setForm({});
      toast.success(`${provider.name} connected! Customers can now pay online.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed. Double-check your keys.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your own payment account — money goes straight to you.</p>
      </div>

      {/* Reassurance banner — this is the whole point of the per-store model */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 rounded-2xl p-4 mb-6 border border-indigo-200 bg-indigo-50"
      >
        <ShieldCheckIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-indigo-900">Your money, your account</p>
          <p className="text-xs text-indigo-700 mt-0.5">
            Payments go directly into the account you connect below. MultiStore never holds or
            touches your money — we only store your keys encrypted, to open checkout on your behalf.
          </p>
        </div>
      </motion.div>

      {/* Always-available fallback */}
      <div className="card p-5 mb-6 flex items-center gap-3 border-emerald-200 bg-emerald-50">
        <BanknotesIcon className="w-5 h-5 text-emerald-700 shrink-0" />
        <div>
          <p className="font-semibold text-sm text-emerald-900">Cash on Delivery</p>
          <p className="text-xs text-emerald-700">Always on by default — works with no setup, no account needed.</p>
        </div>
      </div>

      {/* Provider picker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setSelected('none')}
          className={`p-4 rounded-2xl border-2 text-left transition-all ${
            selected === 'none' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-xl mb-1">🚫</div>
          <p className="font-semibold text-sm">Online payments off</p>
          <p className="text-xs text-gray-500 mt-0.5">COD only</p>
        </button>
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              selected === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">{p.emoji}</div>
            <p className="font-semibold text-sm flex items-center gap-1.5">
              {p.name}
              {settings?.[p.id]?.connected && <span className="text-emerald-500 text-xs">● connected</span>}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{p.blurb}</p>
          </button>
        ))}
      </div>

      {/* Credential form for the selected provider */}
      {selected !== 'none' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6 space-y-4">
          {(() => {
            const provider = PROVIDERS.find((p) => p.id === selected);
            const alreadyConnected = settings?.[provider.id]?.connected;
            return (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-gray-900">{provider.name} credentials</h3>
                  <a href={provider.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                    Where do I find these? ↗
                  </a>
                </div>

                {alreadyConnected && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    {provider.name} is already connected. Leave a field blank to keep its current
                    saved value — only fill in a field if you want to replace it.
                  </p>
                )}

                {provider.fields.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    placeholder={
                      alreadyConnected && field.secret ? '•••••••• (unchanged — enter a new value to replace)' : field.placeholder
                    }
                    value={form[field.key] || ''}
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                ))}

                {provider.modeToggle && (
                  <Select
                    label="Mode"
                    value={form.mode || settings?.[provider.id]?.mode || 'sandbox'}
                    onChange={(e) => set('mode', e.target.value)}
                    options={[
                      { value: 'sandbox', label: 'Sandbox (testing — no real money moves)' },
                      { value: 'live', label: 'Live (real payments)' },
                    ]}
                  />
                )}
              </>
            );
          })()}
        </motion.div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">💾 Save Payment Settings</Button>
      </div>
    </div>
  );
}
