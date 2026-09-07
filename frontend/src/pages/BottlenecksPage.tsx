import React, { useEffect, useState } from 'react';
import { getBottlenecks, getRecommendations, getMetrics } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Cpu, Loader2, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';

export default function BottlenecksPage() {
  const [bottlenecks, setBottlenecks] = useState<any>({ bottlenecks: [] });
  const [recommendations, setRecommendations] = useState<any>({ recommendations: [] });
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getBottlenecks(), getRecommendations(), getMetrics('balanced')])
      .then(([b, r, m]) => {
        if (b.status === 'fulfilled') setBottlenecks(b.value.data);
        if (r.status === 'fulfilled') setRecommendations(r.value.data);
        if (m.status === 'fulfilled') setMetrics(m.value.data);
        setLoading(false);
      });
  }, []);

  const chartData = (bottlenecks.bottlenecks || []).map((bt: any) => ({
    name: bt.resource_name.slice(0, 16),
    utilization: bt.utilization,
    jobs: bt.job_count,
    color: bt.utilization > 90 ? '#ef4444' : bt.utilization > 80 ? '#f59e0b' : '#6366f1'
  }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Bottleneck Analysis</h1>
        <p className="section-subtitle">Identify over-utilized resources and capacity constraints</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/20 flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{bottlenecks.bottlenecks?.filter((b: any) => b.utilization > 90).length || 0}</div>
          <div className="text-sm text-slate-300">Critical Bottlenecks</div>
          <div className="text-xs text-slate-500">&gt;90% utilization</div>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{bottlenecks.bottlenecks?.length || 0}</div>
          <div className="text-sm text-slate-300">Total Bottlenecks</div>
          <div className="text-xs text-slate-500">&gt;70% utilization</div>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-3">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{metrics?.machine_utilization?.toFixed(1) ?? '–'}%</div>
          <div className="text-sm text-slate-300">Avg Machine Util</div>
          <div className="text-xs text-slate-500">Balanced scenario</div>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center mb-3">
            <Lightbulb className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{recommendations.recommendations?.length || 0}</div>
          <div className="text-sm text-slate-300">Action Items</div>
          <div className="text-xs text-slate-500">AI recommendations</div>
        </div>
      </div>

      {bottlenecks.bottlenecks?.length === 0 ? (
        <div className="card p-12 text-center">
          <TrendingUp className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Bottlenecks Detected!</h3>
          <p className="text-slate-400">All resources are within acceptable utilization thresholds (&lt;70%). Generate schedules first if no data appears.</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Resource Utilization — Bottleneck View</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v: any) => [`${v}%`, 'Utilization']} />
                <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                  {chartData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-2 justify-center text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Critical (&gt;90%)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> High (&gt;80%)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Moderate (&gt;70%)</span>
            </div>
          </div>

          {/* Bottleneck cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bottlenecks.bottlenecks.map((bt: any) => (
              <div key={bt.resource_id} className={`card p-5 ${bt.utilization > 90 ? 'border-red-500/30' : 'border-amber-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-white">{bt.resource_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{bt.resource_id}</div>
                  </div>
                  <div className={`text-3xl font-bold ${bt.utilization > 90 ? 'text-red-400' : 'text-amber-400'}`}>
                    {bt.utilization}%
                  </div>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-3">
                  <div className={`h-2.5 rounded-full transition-all duration-700 ${bt.utilization > 90 ? 'bg-red-500' : bt.utilization > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${bt.utilization}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400">{bt.job_count} jobs scheduled</span>
                  <span className="text-slate-400">{bt.busy_hours?.toFixed(1)}h busy</span>
                  <span className={bt.utilization > 90 ? 'badge-red' : 'badge-yellow'}>{bt.resource_type}</span>
                </div>
                <div className="text-xs text-slate-400 bg-slate-700/30 rounded-lg p-2.5 leading-relaxed">
                  💡 {bt.recommendation}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {recommendations.recommendations?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Corrective Actions
              </h3>
              <div className="space-y-2">
                {recommendations.recommendations.map((rec: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-red-500/5 border-red-500/20' :
                    rec.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-blue-500/5 border-blue-500/20'
                  }`}>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 flex-shrink-0 ${
                      rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{rec.priority?.toUpperCase()}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{rec.message}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{rec.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
