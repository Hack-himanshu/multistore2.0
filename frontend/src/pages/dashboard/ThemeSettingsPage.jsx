import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useStoreConfig from '../../context/storeConfig';
import Button from '../../components/ui/Button';

const FONTS = ['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Montserrat', 'Lato', 'Raleway'];
const RADII = [
  { value: 'none', label: 'Sharp' },
  { value: 'sm', label: 'Slight' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Rounded' },
  { value: 'xl', label: 'More' },
  { value: 'full', label: 'Pill' },
];
const BUTTON_STYLES = ['filled', 'outlined', 'ghost', 'gradient'];
const HEADER_STYLES = ['minimal', 'classic', 'bold', 'transparent'];

const COLOR_PRESETS = [
  { name: 'Indigo', primary: '#6366f1', secondary: '#f59e0b', bg: '#ffffff' },
  { name: 'Emerald', primary: '#10b981', secondary: '#f59e0b', bg: '#ffffff' },
  { name: 'Rose', primary: '#e11d48', secondary: '#fb923c', bg: '#fff5f5' },
  { name: 'Violet', primary: '#7c3aed', secondary: '#ec4899', bg: '#faf5ff' },
  { name: 'Sky', primary: '#0284c7', secondary: '#22d3ee', bg: '#f0f9ff' },
  { name: 'Slate Dark', primary: '#6366f1', secondary: '#a855f7', bg: '#0f172a' },
];

export default function ThemeSettingsPage() {
  const { store, updateTheme, isSaving } = useStoreConfig();
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    if (store?.themeSettings) {
      setTheme({ ...store.themeSettings });
    }
  }, [store]);

  if (!theme) return null;

  const set = (key, value) => setTheme((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (preset) => {
    setTheme((prev) => ({ ...prev, primaryColor: preset.primary, secondaryColor: preset.secondary, backgroundColor: preset.bg }));
  };

  const handleSave = async () => {
    const result = await updateTheme(theme);
    if (result.success) toast.success('Theme saved successfully!');
    else toast.error(result.message || 'Failed to save');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Customize colors, fonts, and layout style.</p>
        </div>
        <Button onClick={handleSave} loading={isSaving}>Save Theme</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Color Presets */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Quick Color Presets</h2>
            <div className="grid grid-cols-3 gap-3">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-gray-50 transition-all"
                >
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded-full shadow-sm" style={{ background: p.primary }} />
                    <div className="w-5 h-5 rounded-full shadow-sm" style={{ background: p.secondary }} />
                    <div className="w-5 h-5 rounded-full shadow-sm border border-gray-200" style={{ background: p.bg }} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Custom Colors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: 'primaryColor', label: 'Primary' },
                { key: 'secondaryColor', label: 'Secondary' },
                { key: 'backgroundColor', label: 'Background' },
                { key: 'textColor', label: 'Text' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="relative">
                    <div className="w-10 h-10 rounded-xl shadow-sm border border-gray-200 cursor-pointer overflow-hidden" style={{ background: theme[key] }}>
                      <input
                        type="color"
                        value={theme[key] || '#000000'}
                        onChange={(e) => set(key, e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>
                  </label>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 font-mono">{theme[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Font Family</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => set('fontFamily', f)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    theme.fontFamily === f
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                  style={{ fontFamily: f }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Border Radius</h2>
            <div className="flex gap-3 flex-wrap">
              {RADII.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => set('borderRadius', value)}
                  className={`px-4 py-2 text-xs font-medium border transition-all ${
                    theme.borderRadius === value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                  style={{ borderRadius: { none: '0', sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' }[value] }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Button Style */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Button Style</h2>
            <div className="flex gap-3 flex-wrap">
              {BUTTON_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => set('buttonStyle', s)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${
                    theme.buttonStyle === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="card p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Live Preview</h2>
              <div
                className="rounded-xl overflow-hidden border border-gray-100 shadow-sm"
                style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.fontFamily, color: theme.textColor }}
              >
                {/* Mini header */}
                <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `${theme.primaryColor}20`, backgroundColor: `${theme.primaryColor}08` }}>
                  <div className="font-bold text-xs" style={{ color: theme.primaryColor }}>Your Store</div>
                  <div className="flex gap-2 text-xs" style={{ color: theme.textColor, opacity: 0.6 }}>
                    <span>Home</span><span>Products</span>
                  </div>
                </div>
                {/* Mini hero */}
                <div className="px-4 py-6 text-center">
                  <h3 className="font-bold text-sm mb-1" style={{ color: theme.textColor }}>Welcome!</h3>
                  <p className="text-xs opacity-60 mb-3">Discover amazing products</p>
                  <button
                    className="text-xs px-4 py-1.5 font-semibold text-white"
                    style={{
                      background: theme.primaryColor,
                      borderRadius: { none: '0', sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' }[theme.borderRadius],
                    }}
                  >
                    Shop Now
                  </button>
                </div>
                {/* Mini product cards */}
                <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                  {[1,2].map((n) => (
                    <div key={n} className="rounded-lg overflow-hidden border" style={{ borderColor: `${theme.primaryColor}20` }}>
                      <div className="h-14 flex items-center justify-center text-lg" style={{ background: `${theme.primaryColor}15` }}>🛍️</div>
                      <div className="p-2">
                        <p className="text-xs font-medium mb-1" style={{ color: theme.textColor }}>Product</p>
                        <p className="text-xs font-bold" style={{ color: theme.primaryColor }}>$29.99</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400 text-center">
                Live preview — your customers will see these colors
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} loading={isSaving} size="lg">
          💾 Save Theme
        </Button>
      </div>
    </div>
  );
}
