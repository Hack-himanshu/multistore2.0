import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useStoreConfig from '../../context/storeConfig';
import { uploadService } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import {
  GlobeAltIcon, ShareIcon, MagnifyingGlassIcon, BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const BUSINESS_TYPES = [
  { value: 'Fashion', label: '👗 Fashion' },
  { value: 'Electronics', label: '📱 Electronics' },
  { value: 'Furniture', label: '🛋️ Furniture' },
  { value: 'Jewelry', label: '💍 Jewelry' },
  { value: 'Cosmetics', label: '💄 Cosmetics' },
  { value: 'Restaurant', label: '🍽️ Food' },
  { value: 'Pharmacy', label: '💊 Pharmacy' },
  { value: 'Books', label: '📚 Books' },
  { value: 'Sports', label: '⚽ Sports' },
  { value: 'PetStore', label: '🐾 Pet Store' },
  { value: 'DigitalProducts', label: '💻 Digital' },
  { value: 'Courses', label: '🎓 Courses' },
  { value: 'Agriculture', label: '🌾 Agriculture' },
  { value: 'Grocery', label: '🛒 Grocery' },
  { value: 'LuxuryBrands', label: '✨ Luxury' },
  { value: 'Handmade', label: '🎨 Handmade' },
  { value: 'Other', label: '🏪 Other' },
];

const CURRENCIES = [
  { value: 'USD', label: '🇺🇸 USD — US Dollar' },
  { value: 'EUR', label: '🇪🇺 EUR — Euro' },
  { value: 'GBP', label: '🇬🇧 GBP — British Pound' },
  { value: 'INR', label: '🇮🇳 INR — Indian Rupee' },
  { value: 'CAD', label: '🇨🇦 CAD — Canadian Dollar' },
  { value: 'AUD', label: '🇦🇺 AUD — Australian Dollar' },
  { value: 'JPY', label: '🇯🇵 JPY — Japanese Yen' },
  { value: 'AED', label: '🇦🇪 AED — UAE Dirham' },
];

export default function StoreSettingsPage() {
  const { store, updateStore, isSaving } = useStoreConfig();
  const [form, setForm] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await uploadService.uploadImage(file);
      set('logo', res.data.url);
      toast.success('Logo uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (store) {
      setForm({
        name: store.name || '',
        description: store.description || '',
        logo: store.logo || '',
        businessType: store.businessType || '',
        currency: store.currency || 'USD',
        contactEmail: store.contactEmail || '',
        phone: store.phone || '',
        isPublished: store.isPublished || false,
        address: { ...store.address },
        socialLinks: { ...store.socialLinks },
        seo: { ...store.seo },
      });
    }
  }, [store]);

  if (!form) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const setNested = (group, key, value) => setForm(prev => ({ ...prev, [group]: { ...prev[group], [key]: value } }));

  const handleSave = async () => {
    const result = await updateStore(form);
    if (result.success) toast.success('Store settings saved!');
    else toast.error(result.message || 'Save failed');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: BuildingStorefrontIcon },
    { id: 'seo', label: 'SEO', icon: MagnifyingGlassIcon },
    { id: 'social', label: 'Social Links', icon: ShareIcon },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your store details and visibility.</p>
        </div>
        <Button onClick={handleSave} loading={isSaving}>Save Settings</Button>
      </div>

      {/* Publish Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 rounded-2xl p-4 mb-6 border ${
          form.isPublished
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="text-2xl">{form.isPublished ? '🟢' : '🟡'}</div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${form.isPublished ? 'text-emerald-800' : 'text-amber-800'}`}>
            {form.isPublished ? 'Your store is live!' : 'Your store is unpublished'}
          </p>
          <p className={`text-xs mt-0.5 ${form.isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
            {form.isPublished
              ? `Customers can visit your store at /store/${store?.slug}`
              : 'Publish to make your store visible to customers'}
          </p>
        </div>
        <label className="relative cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={e => set('isPublished', e.target.checked)}
            className="sr-only"
          />
          <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${form.isPublished ? 'bg-emerald-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform duration-200 ${form.isPublished ? 'translate-x-6.5' : 'translate-x-0.5'}`}
              style={{ transform: form.isPublished ? 'translateX(26px)' : 'translateX(2px)' }}
            />
          </div>
        </label>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatedPanel active={activeTab === 'general'}>
        <div className="space-y-4">
          <Input label="Store Name" value={form.name} onChange={e => set('name', e.target.value)} required />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Store Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input-field resize-none" placeholder="Tell customers about your store..." />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Store Logo</label>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-contain" onError={e => e.target.style.display = 'none'} />
                ) : (
                  <span className="text-2xl">🏪</span>
                )}
              </div>
              <label className="cursor-pointer">
                <span className={`btn-outline inline-flex items-center gap-2 !py-2 !px-4 text-sm ${uploadingLogo ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploadingLogo ? <Spinner size="sm" /> : null}
                  {uploadingLogo ? 'Uploading...' : 'Choose from device'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
              {form.logo && (
                <button type="button" onClick={() => set('logo', '')} className="text-xs text-red-500 hover:text-red-600 font-medium">
                  Remove
                </button>
              )}
            </div>
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Or paste an image URL instead</summary>
              <input type="url" value={form.logo} onChange={e => set('logo', e.target.value)} placeholder="https://..." className="input-field mt-2" />
            </details>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Business Type" value={form.businessType} onChange={e => set('businessType', e.target.value)} options={BUSINESS_TYPES} />
            <Select label="Currency" value={form.currency} onChange={e => set('currency', e.target.value)} options={CURRENCIES} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Email" type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
            <Input label="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input label="Street" value={form.address?.street || ''} onChange={e => setNested('address', 'street', e.target.value)} />
              </div>
              <Input label="City" value={form.address?.city || ''} onChange={e => setNested('address', 'city', e.target.value)} />
              <Input label="State / Province" value={form.address?.state || ''} onChange={e => setNested('address', 'state', e.target.value)} />
              <Input label="Country" value={form.address?.country || ''} onChange={e => setNested('address', 'country', e.target.value)} />
              <Input label="ZIP / Postal Code" value={form.address?.zip || ''} onChange={e => setNested('address', 'zip', e.target.value)} />
            </div>
          </div>
        </div>
      </AnimatedPanel>

      <AnimatedPanel active={activeTab === 'seo'}>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">📌 Why SEO matters</p>
            <p className="text-xs">Good meta titles and descriptions help your store rank higher in search engines and get more organic traffic.</p>
          </div>
          <Input
            label="Meta Title"
            value={form.seo?.metaTitle || ''}
            onChange={e => setNested('seo', 'metaTitle', e.target.value)}
            placeholder={`${form.name} — Shop Online`}
            hint="Recommended 50-60 characters"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Meta Description</label>
            <textarea
              value={form.seo?.metaDescription || ''}
              onChange={e => setNested('seo', 'metaDescription', e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="A brief description of your store for search engines..."
            />
            <p className="text-xs text-gray-400 mt-1">{(form.seo?.metaDescription || '').length}/160 characters recommended</p>
          </div>
          <Input
            label="Keywords"
            value={form.seo?.keywords?.join(', ') || ''}
            onChange={e => setNested('seo', 'keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
            placeholder="fashion, online store, trendy clothes"
            hint="Comma-separated keywords"
          />
          {/* SEO Preview */}
          {(form.seo?.metaTitle || form.name) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2 font-medium">Google Preview</p>
              <p className="text-blue-600 text-base font-medium truncate">{form.seo?.metaTitle || form.name}</p>
              <p className="text-emerald-700 text-xs mb-1">https://yourdomain.com/store/{store?.slug}</p>
              <p className="text-gray-600 text-xs leading-relaxed">{form.seo?.metaDescription || 'No description set.'}</p>
            </div>
          )}
        </div>
      </AnimatedPanel>

      <AnimatedPanel active={activeTab === 'social'}>
        <div className="space-y-4">
          {[
            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', icon: '📸' },
            { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage', icon: '👍' },
            { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle', icon: '𝕏' },
            { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/yourchannel', icon: '▶️' },
          ].map(({ key, label, placeholder, icon }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                <span>{icon}</span>{label}
              </label>
              <input
                type="url"
                value={form.socialLinks?.[key] || ''}
                onChange={e => setNested('socialLinks', key, e.target.value)}
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}
        </div>
      </AnimatedPanel>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} loading={isSaving} size="lg">💾 Save Settings</Button>
      </div>
    </div>
  );
}

function AnimatedPanel({ active, children }) {
  if (!active) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      {children}
    </motion.div>
  );
}