import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { productService, categoryService, uploadService } from '../../services/api';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  PhotoIcon, XMarkIcon, StarIcon, FireIcon,
} from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  name: '', description: '', shortDescription: '', price: '',
  compareAtPrice: '', stock: '', sku: '', category: '',
  isFeatured: false, isBestSeller: false, isActive: true,
  images: [], tags: '',
};

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product ? {
    ...product,
    price: product.price || '',
    compareAtPrice: product.compareAtPrice || '',
    stock: product.stock || '',
    tags: product.tags?.join(', ') || '',
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
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

    setUploading(true);
    try {
      const res = await uploadService.uploadImage(file);
      const url = res.data.url;
      setForm(prev => ({
        ...prev,
        images: [{ url, alt: form.name, isPrimary: true }],
      }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Product name is required';
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = 'Valid price required';
    if (form.stock !== '' && isNaN(form.stock)) e.stock = 'Valid stock number required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        stock: form.stock !== '' ? Number(form.stock) : 0,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (product?._id) {
        await productService.update(product._id, payload);
        toast.success('Product updated!');
      } else {
        await productService.create(payload);
        toast.success('Product created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const catOptions = categories.map(c => ({ value: c._id, label: `${c.icon || ''} ${c.name}` }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Product Name" name="name" value={form.name} onChange={handleChange} error={errors.name} required placeholder="e.g. Premium Blue Sneakers" />
            </div>
            <Input label="Price ($)" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} error={errors.price} required placeholder="29.99" />
            <Input label="Compare-at Price ($)" name="compareAtPrice" type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={handleChange} placeholder="49.99 (optional)" hint="Shows as crossed-out price" />
            <Input label="Stock Quantity" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} error={errors.stock} placeholder="100" />
            <Input label="SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="SKU-001" />
            <div className="sm:col-span-2">
              <Select label="Category" name="category" value={form.category || ''} onChange={handleChange} options={catOptions} placeholder="Select a category" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Short Description</label>
              <textarea
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                rows={2}
                className="input-field resize-none"
                placeholder="Brief product summary (shown on product cards)"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="input-field resize-none"
                placeholder="Detailed product description with features, materials, etc."
              />
            </div>
            <div className="sm:col-span-2">
              <Input label="Tags (comma-separated)" name="tags" value={form.tags} onChange={handleChange} placeholder="sneakers, casual, blue, men" hint="Helps customers find your product" />
            </div>

            {/* Product Image — upload from device */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Product Image</label>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Preview */}
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {form.images?.[0]?.url ? (
                    <img src={form.images[0].url} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                {/* Upload button */}
                <label className="cursor-pointer">
                  <span className={`btn-outline inline-flex items-center gap-2 !py-2 !px-4 text-sm ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    {uploading ? <Spinner size="sm" /> : <PhotoIcon className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Choose from device'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>

                {form.images?.[0]?.url && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, images: [] }))}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Fallback: paste a URL directly */}
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Or paste an image URL instead</summary>
                <input
                  type="url"
                  placeholder="https://..."
                  className="input-field mt-2"
                  onChange={e => setForm(prev => ({
                    ...prev,
                    images: e.target.value ? [{ url: e.target.value, alt: form.name, isPrimary: true }] : []
                  }))}
                  defaultValue={form.images?.[0]?.url || ''}
                />
              </details>
            </div>

            {/* Flags */}
            <div className="sm:col-span-2 flex gap-6 flex-wrap">
              {[
                { name: 'isActive', label: 'Active (visible in store)' },
                { name: 'isFeatured', label: 'Featured Product ⭐' },
                { name: 'isBestSeller', label: 'Best Seller 🔥' },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={name}
                    checked={form[name] || false}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>
            {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', product?: {} }
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, isActive: undefined };
      if (debouncedSearch) params.search = debouncedSearch;
      const [prodRes, catRes] = await Promise.all([
        productService.getAll(params),
        categoryService.getAll(),
      ]);
      setProducts(prodRes.data.products);
      setTotal(prodRes.data.total);
      setCategories(catRes.data.categories);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(product._id);
    try {
      await productService.delete(product._id);
      toast.success('Product deleted');
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 rounded-[28px] border border-gray-200/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Product catalog</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-500">{total} products in your store</p>
          </div>
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setModal({ mode: 'create' })}>
            Add Product
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Active</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{products.filter((p) => p.isActive).length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Low stock</p>
            <p className="mt-1 text-lg font-semibold text-amber-600">{products.filter((p) => p.stock <= 5).length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Featured</p>
            <p className="mt-1 text-lg font-semibold text-emerald-600">{products.filter((p) => p.isFeatured).length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No products yet</h3>
          <p className="text-gray-500 text-sm mb-6">Add your first product to start selling</p>
          <Button onClick={() => setModal({ mode: 'create' })} leftIcon={<PlusIcon className="w-4 h-4" />}>
            Add First Product
          </Button>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Flags</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {products.map((p, i) => (
                      <motion.tr
                        key={p._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                              {p.images?.[0]?.url ? (
                                <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                              ) : (
                                <PhotoIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 truncate max-w-[180px]">{p.name}</p>
                              <p className="text-xs text-gray-400">SKU: {p.sku || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-900">${p.price.toFixed(2)}</p>
                          {p.compareAtPrice && (
                            <p className="text-xs text-gray-400 line-through">${p.compareAtPrice.toFixed(2)}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`font-semibold text-sm ${p.stock <= 5 ? 'text-red-600' : p.stock <= 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.isActive ? '● Active' : '○ Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            {p.isFeatured && <span title="Featured" className="text-amber-500"><StarIcon className="w-4 h-4" /></span>}
                            {p.isBestSeller && <span title="Best Seller" className="text-orange-500"><FireIcon className="w-4 h-4" /></span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal({ mode: 'edit', product: p })}
                              className="p-2 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              disabled={deleting === p._id}
                              className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === p._id ? <Spinner size="xs" /> : <TrashIcon className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Button>
              <span className="text-sm text-gray-600 px-4">Page {page} of {pages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</Button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <ProductModal
            product={modal.product}
            categories={categories}
            onClose={() => setModal(null)}
            onSave={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
