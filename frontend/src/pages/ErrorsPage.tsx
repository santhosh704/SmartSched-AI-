import React, { useEffect, useState } from 'react';
import { getErrors, getBottlenecks, getRecommendations } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { AlertTriangle, Activity, Lightbulb, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const PARETO_COLOR = '#6366f1';

export default function ErrorsPage() {
  const [errors, setErrors] = useState<any>({ errors: [], total_violations: 0 });
  const [bottlenecks, setBottlenecks] = useState<any>({ bottlenecks: [] });
  const [recommendations, setRecommendations] = useState<any>({ recommendations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getErrors(), getBottlenecks(), getRecommendations()])
      .then(([e, b, r]) => {
        if (e.status === 'fulfilled') setErrors(e.value.data);
        if (b.status === 'fulfilled') setBottlenecks(b.value.data);
        if (r.status === 'fulfilled') setRecommendations(r.value.data);
        setLoading(false);
      });
  }, []);

  // Pareto: cumulative percentage
  let cumulative = 0;
  const paretoData = (errors.errors || []).map((e: any) => {
    cumulative += e.percentage;
    return { ...e, cumulative };
  });

  const priorityColors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#6366f1' };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Error Analysis & Bottlenecks</h1>
        <p className="section-subtitle">Constraint violations, resource bottlenecks, and recommendations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className={`text-3xl font-bold ${errors.total_violations === 0 ? 'text-emerald-400' : 'text-red-400'}`}>{errors.total_violations || 0}</div>
          <div className="text-sm text-slate-400">Total Violations</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-amber-400">{bottlenecks.bottlenecks?.length || 0}</div>
          <div className="text-sm text-slate-400">Bottleneck Resources</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-indigo-400">{recommendations.recommendations?.length || 0}</div>
          <div className="text-sm text-slate-400">Recommendations</div>
        </div>
      </div>

      {errors.total_violations === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Constraint Violations!</h3>
          <p className="text-slate-400">All hard constraints H1–H12 are satisfied in the current schedule.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pareto chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Error Pareto Analysis
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paretoData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="cause" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v: any, name: any) => [name === 'cumulative' ? `${v.toFixed(1)}%` : v, name === 'cumulative' ? 'Cumulative %' : 'Count']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {paretoData.map((_: any, i: number) => <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#f59e0b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Violation Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={errors.errors} dataKey="count" nameKey="cause" cx="50%" cy="50%"
                  outerRadius={90} label={(props: any) => `${props.cause}: ${props.percentage}%`} labelLine={false}>
                  {(errors.errors || []).map((_: any, i: number) => (
                    <Cell key={i} fill={['#ef4444', '#f97316', '#f59e0b', '#6366f1', '#8b5cf6'][i % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Error details table */}
      {(errors.errors || []).length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-white">Constraint Violation Details</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="th">Violation Cause</th>
                <th className="th">Count</th>
                <th className="th">% of Total</th>
                <th className="th">Affected Orders</th>
                <th className="th">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {paretoData.map((e: any) => (
                <tr key={e.cause} className="table-row">
                  <td className="td font-medium text-red-300">{e.cause}</td>
                  <td className="td text-red-400 font-bold">{e.count}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 max-w-20">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${e.percentage}%` }} />
                      </div>
                      <span className="text-slate-300">{e.percentage}%</span>
                    </div>
                  </td>
                  <td className="td text-xs text-slate-400">{e.affected_orders?.slice(0, 3).join(', ')}{e.affected_orders?.length > 3 ? ` +${e.affected_orders.length - 3}` : ''}</td>
                  <td className="td text-slate-300">{e.cumulative?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottlenecks */}
      {bottlenecks.bottlenecks?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Resource Bottlenecks</h3>
          </div>
          <div className="p-4 space-y-3">
            {bottlenecks.bottlenecks.map((bt: any) => (
              <div key={bt.resource_id} className="flex items-center gap-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-amber-300">{bt.resource_name}</span>
                    <span className="text-xs text-slate-400">{bt.resource_id}</span>
                    <span className="badge-yellow">{bt.job_count} jobs</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2 mb-1">
                    <div className={`h-2 rounded-full ${bt.utilization > 90 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${bt.utilization}%` }} />
                  </div>
                  <div className="text-xs text-slate-400">{bt.recommendation}</div>
                </div>
                <div className={`text-2xl font-bold ${bt.utilization > 90 ? 'text-red-400' : 'text-amber-400'}`}>
                  {bt.utilization}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.recommendations?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.recommendations.map((rec: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border ${rec.priority === 'high' ? 'bg-red-500/5 border-red-500/20' : rec.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${priorityColors[rec.priority]}`} style={{ background: `${priorityColors[rec.priority]}20`, color: priorityColors[rec.priority] }}>{rec.priority}</span>
                  <span className="text-xs text-slate-400 capitalize">{rec.type}</span>
                </div>
                <div className="text-sm font-medium text-white mb-1">{rec.message}</div>
                <div className="text-xs text-slate-400">{rec.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const priorityColors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#6366f1' };
