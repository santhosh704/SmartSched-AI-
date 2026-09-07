import React, { useEffect, useState } from 'react';
import { getOrders, createOrder, updateOrder, deleteOrder, getProducts } from '../api/client';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Loader2, X, ShoppingCart } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const PRIORITY_LABELS: Record<number, string> = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low', 5: 'Routine' };
const PRIORITY_BG: Record<number, string> = {
  1: 'badge-red', 2: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30',
  3: 'badge-yellow', 4: 'badge-blue', 5: 'badge-purple'
};
const STATUS_CLASS: Record<string, string> = {
  pending: 'badge-yellow', scheduled: 'badge-blue', in_progress: 'badge-purple',
  completed: 'badge-green', cancelled: 'status-cancelled'
};

function OrderModal({ order, products, onClose, onSave }: any) {
  const [form, setForm] = useState(order || {
    order_id: `ORD-${String(Date.now()).slice(-4)}`,
    customer_name: '', product_id: products[0]?.product_id || '',
    quantity: 10, priority: 3,
    release_date: new Date().toISOString().slice(0, 16),
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    status: 'pending', notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">{order ? 'Edit Order' : 'New Order'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Order ID</label><input className="input" value={form.order_id} onChange={e => setForm({...form, order_id: e.target.value})} required /></div>
            <div><label className="label">Customer Name</label><input className="input" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} required /></div>
            <div>
              <label className="label">Product</label>
              <select className="input" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_id} — {p.product_name}</option>)}
              </select>
            </div>
            <div><label className="label">Quantity</label><input className="input" type="number" min={1} value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} required /></div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({...form, priority: parseInt(e.target.value)})}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Release Date</label><input className="input" type="datetime-local" value={form.release_date?.slice(0, 16)} onChange={e => setForm({...form, release_date: e.target.value})} required /></div>
            <div><label className="label">Due Date</label><input className="input" type="datetime-local" value={form.due_date?.slice(0, 16)} onChange={e => setForm({...form, due_date: e.target.value})} required /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Order</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; order?: any }>({ open: false });
  const [selected, setSelected] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [ordersRes, prodsRes] = await Promise.all([getOrders(), getProducts()]);
    setOrders(ordersRes.data);
    setProducts(prodsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredOrders = orders.filter(o => {
    const matchSearch = !search || o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.product_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchPriority = !priorityFilter || String(o.priority) === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleSave = async (form: any) => {
    try {
      if (modal.order) {
        await updateOrder(form.order_id, form);
      } else {
        await createOrder(form);
      }
      setModal({ open: false });
      fetchAll();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Error saving order');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Cancel order ${id}?`)) return;
    await deleteOrder(id);
    fetchAll();
  };

  const now = new Date();
  const urgentCount = orders.filter(o => o.priority <= 2 && o.status === 'pending').length;
  const overdueCount = orders.filter(o => new Date(o.due_date) < now && !['completed', 'cancelled'].includes(o.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Order Management</h1>
          <p className="section-subtitle">
            {orders.length} orders total
            {urgentCount > 0 && <span className="text-red-400 ml-2">· {urgentCount} urgent</span>}
            {overdueCount > 0 && <span className="text-amber-400 ml-2">· {overdueCount} overdue</span>}
          </p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search orders, customers, products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input max-w-40" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
        </select>
        {(search || statusFilter || priorityFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }} className="btn-secondary text-xs">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <ShoppingCart className="w-12 h-12 mb-3 text-slate-700" />
            <p className="font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th className="th">Order ID</th>
                  <th className="th">Customer</th>
                  <th className="th">Product</th>
                  <th className="th">Qty</th>
                  <th className="th">Priority</th>
                  <th className="th">Release</th>
                  <th className="th">Due Date</th>
                  <th className="th">Status</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const isOverdue = new Date(order.due_date) < now && !['completed', 'cancelled'].includes(order.status);
                  return (
                    <tr key={order.order_id} className={`table-row ${selected === order.order_id ? 'bg-indigo-500/10' : ''}`} onClick={() => setSelected(selected === order.order_id ? null : order.order_id)}>
                      <td className="td font-mono text-indigo-400 font-medium">{order.order_id}</td>
                      <td className="td font-medium">{order.customer_name}</td>
                      <td className="td">
                        <div className="font-medium text-slate-200">{order.product_id}</div>
                        <div className="text-xs text-slate-500">{order.product_name}</div>
                      </td>
                      <td className="td font-medium">{order.quantity}</td>
                      <td className="td"><span className={PRIORITY_BG[order.priority]}>{PRIORITY_LABELS[order.priority]}</span></td>
                      <td className="td text-xs">{new Date(order.release_date).toLocaleDateString('en-IN')}</td>
                      <td className={`td text-xs ${isOverdue ? 'text-red-400 font-semibold' : ''}`}>
                        {new Date(order.due_date).toLocaleDateString('en-IN')}
                        {isOverdue && <span className="ml-1 text-xs text-red-400">⚠ Overdue</span>}
                      </td>
                      <td className="td"><span className={STATUS_CLASS[order.status] || 'badge-blue'}>{order.status}</span></td>
                      <td className="td">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setModal({ open: true, order })} className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-indigo-400 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(order.order_id)} className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (() => {
        const order = orders.find(o => o.order_id === selected);
        if (!order) return null;
        return (
          <div className="card p-5 border-indigo-500/30">
            <div className="flex justify-between mb-3">
              <h3 className="font-bold text-white">Order Detail — {order.order_id}</h3>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-slate-400">Customer</div><div className="font-medium">{order.customer_name}</div></div>
              <div><div className="text-slate-400">Product</div><div className="font-medium">{order.product_id}</div></div>
              <div><div className="text-slate-400">Quantity</div><div className="font-medium">{order.quantity} units</div></div>
              <div><div className="text-slate-400">Priority</div><div className="font-medium">{PRIORITY_LABELS[order.priority]}</div></div>
              <div><div className="text-slate-400">Release</div><div className="font-medium">{new Date(order.release_date).toLocaleString('en-IN')}</div></div>
              <div><div className="text-slate-400">Due Date</div><div className="font-medium">{new Date(order.due_date).toLocaleString('en-IN')}</div></div>
              <div><div className="text-slate-400">Status</div><span className={STATUS_CLASS[order.status]}>{order.status}</span></div>
            </div>
            {order.notes && <div className="mt-3 text-sm text-slate-400"><span className="font-medium text-slate-300">Notes: </span>{order.notes}</div>}
          </div>
        );
      })()}

      {modal.open && <OrderModal order={modal.order} products={products} onClose={() => setModal({ open: false })} onSave={handleSave} />}
    </div>
  );
}
