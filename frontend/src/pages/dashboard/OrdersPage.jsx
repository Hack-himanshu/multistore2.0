import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { orderService } from '../../services/api';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { XMarkIcon, MagnifyingGlassIcon, TruckIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  shipped: 'bg-purple-50 text-purple-700 border border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ Pending' },
  { value: 'confirmed', label: '✅ Confirmed' },
  { value: 'processing', label: '⚙️ Processing' },
  { value: 'shipped', label: '📦 Shipped' },
  { value: 'delivered', label: '🎉 Delivered' },
  { value: 'cancelled', label: '❌ Cancelled' },
  { value: 'refunded', label: '↩️ Refunded' },
];

function OrderDetailModal({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await orderService.updateStatus(order._id, status, note, trackingNumber);
      toast.success('Order updated!');
      onUpdate();
      onClose();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Order {order.orderNumber}</h2>
            <p className="text-xs text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Customer */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h3>
            <p className="font-medium text-gray-800 text-sm">{order.shippingAddress?.fullName}</p>
            <p className="text-sm text-gray-500">{order.customerEmail}</p>
            <p className="text-sm text-gray-500">{order.shippingAddress?.phone}</p>
          </div>

          {/* Shipping Address */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {order.shippingAddress?.street}, {order.shippingAddress?.city},{' '}
              {order.shippingAddress?.state} {order.shippingAddress?.zip},{' '}
              {order.shippingAddress?.country}
            </p>
          </div>

          {/* Items */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items ({order.items?.length})</h3>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg overflow-hidden shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-lg font-bold text-indigo-600">${order.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Update Status */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Order</h3>
            <Select
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
            {(status === 'shipped') && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="input-field"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Note (optional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} className="input-field" placeholder="Internal note about this update" />
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status History</h3>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700 capitalize">{h.status}</span>
                      {h.note && <span className="text-gray-500"> — {h.note}</span>}
                      <p className="text-gray-400">{new Date(h.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await orderService.getAll(params);
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by order # or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9" />
        </div>
        <Select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-48"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
          <p className="text-sm text-gray-500">Orders from your customers will appear here</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {orders.map((order, i) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-900 font-mono text-xs">{order.orderNumber}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800 truncate max-w-[140px]">{order.shippingAddress?.fullName}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{order.customerEmail}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-gray-900">${order.total?.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="xs" onClick={() => setSelectedOrder(order)}>
                            <TruckIcon className="w-3.5 h-3.5 mr-1" />View
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Button>
              <span className="text-sm text-gray-600 px-4">Page {page} of {pages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</Button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
