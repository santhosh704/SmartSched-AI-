import React, { useEffect, useState } from 'react';
import { getProducts, getRoutings } from '../api/client';
import { Package, ChevronDown, ChevronUp, Clock, Cpu, Users, Wrench, Box, ArrowRight } from 'lucide-react';

const SETUP_COLORS: Record<string, string> = {
  SF_PCB: 'bg-indigo-500/20 text-indigo-400', SF_WIRE: 'bg-orange-500/20 text-orange-400',
  SF_ENCL: 'bg-blue-500/20 text-blue-400', SF_TEST: 'bg-emerald-500/20 text-emerald-400',
  SF_QC: 'bg-purple-500/20 text-purple-400', SF_CTRL: 'bg-red-500/20 text-red-400',
  SF_SENSOR: 'bg-cyan-500/20 text-cyan-400', SF_PANEL: 'bg-amber-500/20 text-amber-400',
  SF_CAL: 'bg-pink-500/20 text-pink-400', SF_PROG: 'bg-teal-500/20 text-teal-400',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getRoutings()]).then(([pRes, rRes]) => {
      setProducts(pRes.data);
      setRoutings(rRes.data);
      setLoading(false);
    });
  }, []);

  const getProductRoutings = (productId: string) =>
    routings.filter(r => r.product_id === productId).sort((a, b) => a.sequence - b.sequence);

  const totalOpsTime = (productId: string) =>
    getProductRoutings(productId).reduce((s, r) => s + r.duration_minutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Products & Routing</h1>
        <p className="section-subtitle">8 product variants with complete operation routing sequences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Product Variants', value: products.length, color: 'text-indigo-400' },
          { label: 'Total Operations', value: routings.length, color: 'text-blue-400' },
          { label: 'Avg Ops/Product', value: products.length ? (routings.length / products.length).toFixed(1) : 0, color: 'text-emerald-400' },
          { label: 'Setup Families', value: [...new Set(routings.map(r => r.setup_family))].length, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center"><div className="w-8 h-8 spinner" /></div>
      ) : (
        <div className="space-y-3">
          {products.map(product => {
            const ops = getProductRoutings(product.product_id);
            const expanded = expandedProduct === product.product_id;
            const totalMins = totalOpsTime(product.product_id);

            return (
              <div key={product.product_id} className="card overflow-hidden hover:border-indigo-500/30 transition-all">
                <button
                  onClick={() => setExpandedProduct(expanded ? null : product.product_id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 font-mono">{product.product_id}</span>
                        <span className="badge-purple text-xs">{product.variant}</span>
                      </div>
                      <div className="text-sm font-medium text-white">{product.product_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{product.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center hidden md:block">
                      <div className="text-white font-bold">{ops.length}</div>
                      <div className="text-slate-400 text-xs">Operations</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="text-white font-bold">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div>
                      <div className="text-slate-400 text-xs">Total Time</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="text-emerald-400 font-bold">₹{(product.standard_cost / 1000).toFixed(1)}K</div>
                      <div className="text-slate-400 text-xs">Standard Cost</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="text-amber-400 font-bold">{product.batch_size}</div>
                      <div className="text-slate-400 text-xs">Batch Size</div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-700/50 p-5">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4">Operation Routing Sequence</h4>
                    {/* Flow diagram */}
                    <div className="flex items-start gap-2 overflow-x-auto pb-3 mb-4">
                      {ops.map((op, i) => (
                        <React.Fragment key={op.routing_id}>
                          <div className={`flex-shrink-0 rounded-lg p-3 border text-center min-w-28 ${SETUP_COLORS[op.setup_family] || 'bg-slate-700/30 text-slate-300'} border-current border-opacity-30`}>
                            <div className="text-xs font-bold mb-1">OP{String(i + 1).padStart(2, '0')}</div>
                            <div className="text-xs font-medium leading-tight">{op.operation_name}</div>
                            <div className="text-xs mt-1 opacity-70">{op.duration_minutes}m</div>
                          </div>
                          {i < ops.length - 1 && <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-4" />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Detailed table */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="th">Seq</th>
                          <th className="th">Operation</th>
                          <th className="th">Duration</th>
                          <th className="th">Machines</th>
                          <th className="th">Skills Required</th>
                          <th className="th">Tools</th>
                          <th className="th">Materials</th>
                          <th className="th">Setup Family</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ops.map(op => (
                          <tr key={op.routing_id} className="table-row">
                            <td className="td font-bold text-slate-400">#{op.sequence}</td>
                            <td className="td font-medium">{op.operation_name}</td>
                            <td className="td"><div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" />{op.duration_minutes} min</div></td>
                            <td className="td"><div className="flex flex-wrap gap-1">{op.required_machine_types?.map((m: string) => <span key={m} className="badge-blue text-xs">{m}</span>)}</div></td>
                            <td className="td"><div className="flex flex-wrap gap-1">{op.required_skills?.map((s: string) => <span key={s} className="badge-purple text-xs">{s}</span>)}</div></td>
                            <td className="td"><div className="flex flex-wrap gap-1">{op.required_tools?.map((t: string) => <span key={t} className="badge-yellow text-xs">{t}</span>)}</div></td>
                            <td className="td text-xs text-slate-400">{Object.keys(op.required_materials || {}).join(', ') || '—'}</td>
                            <td className="td"><span className={`text-xs px-2 py-0.5 rounded-full ${SETUP_COLORS[op.setup_family] || 'bg-slate-600 text-slate-300'}`}>{op.setup_family}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
