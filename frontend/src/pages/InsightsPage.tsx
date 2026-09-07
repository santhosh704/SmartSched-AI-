import React, { useEffect, useState } from 'react';
import { getEnvironment, getEthics, getMaintenanceImpact } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Leaf, Scale, Wrench, Loader2, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TABS = [
  { key: 'environment', label: 'Environmental', icon: Leaf },
  { key: 'ethics', label: 'Ethics & Fairness', icon: Scale },
  { key: 'maintenance', label: 'Maintenance Impact', icon: Wrench },
];

const OBJ_COLORS: Record<string, string> = {
  baseline: '#94a3b8', delivery_first: '#6366f1', cost_first: '#10b981', balanced: '#f59e0b'
};
const OBJ_LABELS: Record<string, string> = {
  baseline: 'Baseline', delivery_first: 'Delivery First', cost_first: 'Cost First', balanced: 'Balanced'
};
const SEVERITY_COLORS: Record<string, string> = { High: 'badge-red', Medium: 'badge-yellow', Low: 'badge-green' };
const STATUS_COLORS: Record<string, string> = { Monitoring: 'badge-blue', Controlled: 'badge-green', Risk: 'badge-red' };

export default function InsightsPage({ defaultTab = 'environment' }: { defaultTab?: string }) {
  const [tab, setTab] = useState(defaultTab);
  const [env, setEnv] = useState<any>(null);
  const [ethics, setEthics] = useState<any>(null);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getEnvironment(), getEthics(), getMaintenanceImpact()])
      .then(([e, eth, m]) => {
        if (e.status === 'fulfilled') setEnv(e.value.data);
        if (eth.status === 'fulfilled') setEthics(eth.value.data);
        if (m.status === 'fulfilled') setMaintenance(m.value.data);
        setLoading(false);
      });
  }, []);

  const energyBarData = env?.scenarios
    ? Object.entries(env.scenarios).map(([k, v]: any) => ({
        name: OBJ_LABELS[k] || k,
        energy: v.total_energy_kwh,
        co2: v.co2_kg,
        color: OBJ_COLORS[k]
      }))
    : [];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Impact Analysis</h1>
        <p className="section-subtitle">Environmental, ethical, and operational impact assessment</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Environmental */}
      {tab === 'environment' && (
        <div className="space-y-4">
          {!env?.scenarios || Object.keys(env.scenarios).length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              <Leaf className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>Generate schedules first to see environmental impact</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(env.scenarios).map(([k, v]: any) => (
                  <div key={k} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: OBJ_COLORS[k] }} />
                      <span className="text-xs font-semibold text-slate-400">{OBJ_LABELS[k]}</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{v.total_energy_kwh?.toFixed(0)}</div>
                    <div className="text-xs text-slate-400 mb-2">kWh total energy</div>
                    <div className="text-lg font-bold text-amber-400">{v.co2_kg?.toFixed(1)}</div>
                    <div className="text-xs text-slate-400">kg CO₂-eq</div>
                    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-400">Idle</span><span>{v.idle_energy_kwh?.toFixed(1)} kWh</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Overtime</span><span>{v.overtime_energy_kwh?.toFixed(1)} kWh</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Changeover</span><span>{v.changeover_energy_kwh?.toFixed(1)} kWh</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Energy & CO₂ Comparison</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={energyBarData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      formatter={(v: any, name: any) => [name === 'co2' ? `${v.toFixed(1)} kg CO₂` : `${v.toFixed(0)} kWh`, name === 'co2' ? 'CO₂' : 'Energy']} />
                    <Bar dataKey="energy" radius={[4, 4, 0, 0]} name="Energy (kWh)">
                      {energyBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="alert-warning">
                <div className="font-medium mb-1">⚠ Disclaimer</div>
                <div className="text-sm">{env.disclaimer}</div>
                <div className="text-xs mt-1 text-amber-300">CO₂ factor: {env.co2_factor} kg/{env.co2_unit}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Ethics */}
      {tab === 'ethics' && ethics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Fairness Score', value: `${ethics.workload_analysis?.fairness_score}%`, color: ethics.workload_analysis?.fairness_score >= 80 ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'Avg Workload', value: `${ethics.workload_analysis?.avg_hours?.toFixed(1)}h`, color: 'text-blue-400' },
              { label: 'Max Workload', value: `${ethics.workload_analysis?.max_hours?.toFixed(1)}h`, color: 'text-red-400' },
              { label: 'Imbalance', value: `${ethics.workload_analysis?.imbalance_hours?.toFixed(1)}h`, color: ethics.workload_analysis?.imbalance_hours > 4 ? 'text-red-400' : 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-white mb-1">Ethical AI Risk Register</h3>
            <p className="text-xs text-slate-400 mb-4">{ethics.ethical_framework}</p>
            <div className="space-y-3">
              {ethics.risk_register?.map((risk: any) => (
                <div key={risk.risk} className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{risk.risk}</span>
                      <span className={SEVERITY_COLORS[risk.severity]}>{risk.severity}</span>
                      <span className={STATUS_COLORS[risk.status]}>{risk.status}</span>
                    </div>
                    <div className="text-xs text-slate-400">{risk.description}</div>
                    <div className="text-xs text-emerald-400 mt-1">Mitigation: {risk.mitigation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Maintenance */}
      {tab === 'maintenance' && maintenance && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Windows', value: maintenance.total_maintenance_windows, color: 'text-blue-400' },
              { label: 'Upcoming', value: maintenance.upcoming_windows, color: 'text-amber-400' },
              { label: 'Total Downtime', value: `${maintenance.total_downtime_hours?.toFixed(1)}h`, color: 'text-red-400' },
              { label: 'Mandatory Downtime', value: `${maintenance.mandatory_downtime_hours?.toFixed(1)}h`, color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-white">All Maintenance Windows</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="th">Machine</th><th className="th">Type</th><th className="th">Start</th>
                  <th className="th">End</th><th className="th">Duration</th><th className="th">Mandatory</th><th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.windows?.map((mw: any) => (
                  <tr key={mw.maintenance_id} className="table-row">
                    <td className="td"><div className="font-medium text-white">{mw.machine_name}</div><div className="text-xs font-mono text-slate-400">{mw.machine_id}</div></td>
                    <td className="td text-xs">{mw.maintenance_type}</td>
                    <td className="td text-xs font-mono">{new Date(mw.start_time).toLocaleString('en-IN')}</td>
                    <td className="td text-xs font-mono">{new Date(mw.end_time).toLocaleString('en-IN')}</td>
                    <td className="td text-amber-400">{mw.duration_hours?.toFixed(1)}h</td>
                    <td className="td">{mw.mandatory ? <span className="badge-red">Yes</span> : <span className="badge-green">No</span>}</td>
                    <td className="td">
                      <span className={mw.status === 'upcoming' ? 'badge-yellow' : 'badge-green'}>
                        {mw.status === 'upcoming' ? '⏱ Upcoming' : '✓ Complete'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
