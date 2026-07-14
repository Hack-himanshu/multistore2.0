import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useStoreConfig from '../../context/storeConfig';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { CheckIcon } from '@heroicons/react/24/outline';

const SECTIONS = [
  { key: 'hero', label: 'Hero Banner', icon: '🦸', desc: 'Main hero section with heading, CTA button.' },
  { key: 'banner', label: 'Announcement Banner', icon: '📢', desc: 'A top banner for promotions.' },
  { key: 'categories', label: 'Categories', icon: '🗂️', desc: 'Show product category grid.' },
  { key: 'featuredProducts', label: 'Featured Products', icon: '⭐', desc: 'Showcase handpicked products.' },
  { key: 'bestSellers', label: 'Best Sellers', icon: '🔥', desc: 'Most sold products.' },
  { key: 'testimonials', label: 'Testimonials', icon: '💬', desc: 'Customer reviews and ratings.' },
  { key: 'newsletter', label: 'Newsletter', icon: '📧', desc: 'Email subscription signup.' },
  { key: 'faq', label: 'FAQ', icon: '❓', desc: 'Frequently asked questions.' },
  { key: 'blog', label: 'Blog', icon: '📝', desc: 'Latest blog posts.' },
  { key: 'brands', label: 'Brand Logos', icon: '🏷️', desc: 'Partner or trusted brand logos.' },
];

export default function HomepageBuilderPage() {
  const { store, updateHomepage, isSaving, setSectionLocally } = useStoreConfig();
  const [sections, setSections] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (store?.homepageSections) {
      setSections(JSON.parse(JSON.stringify(store.homepageSections)));
    }
  }, [store]);

  if (!sections) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const toggle = (key) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key]?.enabled },
    }));
  };

  const updateField = (section, field, value) => {
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async () => {
    const result = await updateHomepage(sections);
    if (result.success) toast.success('Homepage saved!');
    else toast.error(result.message || 'Save failed');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Toggle sections on/off and customize their content.</p>
        </div>
        <Button onClick={handleSave} loading={isSaving} size="md">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map(({ key, label, icon, desc }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`card p-5 transition-all ${sections[key]?.enabled ? 'ring-2 ring-indigo-500/30' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
                  {/* Toggle */}
                  <button
                    onClick={() => toggle(key)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                      sections[key]?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                    style={{ height: '22px', width: '40px' }}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        sections[key]?.enabled ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                      style={{ width: '18px', height: '18px', transform: sections[key]?.enabled ? 'translateX(18px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">{desc}</p>

                {/* Expandable edit panel */}
                {sections[key]?.enabled && (
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    {key === 'hero' && (
                      <>
                        <Input
                          label="Heading"
                          value={sections.hero?.heading || ''}
                          onChange={(e) => updateField('hero', 'heading', e.target.value)}
                          placeholder="Welcome to our store"
                        />
                        <Input
                          label="Subheading"
                          value={sections.hero?.subheading || ''}
                          onChange={(e) => updateField('hero', 'subheading', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="CTA Text"
                            value={sections.hero?.ctaText || ''}
                            onChange={(e) => updateField('hero', 'ctaText', e.target.value)}
                          />
                          <Input
                            label="CTA Link"
                            value={sections.hero?.ctaLink || ''}
                            onChange={(e) => updateField('hero', 'ctaLink', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    {key === 'banner' && (
                      <Input
                        label="Banner Text"
                        value={sections.banner?.text || ''}
                        onChange={(e) => updateField('banner', 'text', e.target.value)}
                        placeholder="🎉 Free shipping on orders over $50"
                      />
                    )}
                    {(key === 'featuredProducts' || key === 'bestSellers' || key === 'categories' || key === 'blog') && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Section Heading"
                          value={sections[key]?.heading || ''}
                          onChange={(e) => updateField(key, 'heading', e.target.value)}
                        />
                        <Input
                          label="Display Count"
                          type="number"
                          min={1}
                          max={20}
                          value={sections[key]?.displayCount || 4}
                          onChange={(e) => updateField(key, 'displayCount', Number(e.target.value))}
                        />
                      </div>
                    )}
                    {(key === 'newsletter' || key === 'testimonials' || key === 'faq') && (
                      <>
                        <Input
                          label="Section Heading"
                          value={sections[key]?.heading || ''}
                          onChange={(e) => updateField(key, 'heading', e.target.value)}
                        />
                        {key === 'newsletter' && (
                          <Input
                            label="Subheading"
                            value={sections[key]?.subheading || ''}
                            onChange={(e) => updateField(key, 'subheading', e.target.value)}
                          />
                        )}
                      </>
                    )}
                    {sections[key]?.enabled && key !== 'hero' && key !== 'banner' && !['featuredProducts','bestSellers','categories','blog','newsletter','testimonials','faq'].includes(key) && (
                      <p className="text-xs text-indigo-600">✅ Section enabled</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} loading={isSaving} size="lg">
          {isSaving ? 'Saving...' : '💾 Save Homepage'}
        </Button>
      </div>
    </div>
  );
}
