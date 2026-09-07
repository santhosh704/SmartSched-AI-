import React, { useEffect, useState } from 'react';
import { compareScenarios, getAllSchedules } from '../api/client';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Legend
} from 'recharts';
import { Loader2, Play, Star, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

const SCENARIO_COLORS: Record<string, string> = {
  baseline: '#94a3b8', delivery_first: '#6366f1', cost_first: '#10b981', balanced: '#f59e0b'
};
const SCENARIO_LABELS: Record<string, string> = {
  baseline: 'Baseline (FIFO)', delivery_first: 'Delivery First', cost_first: 'Cost First', balanced: 'Balanced'
};

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [recommended, setRecommended] = useState('');
  const [tradeOff, setTradeOff] = useState<any>({});

  useEffect(() => {
    getAllSchedules().then(res => {
      const byObjective: any = {};
      res.data.forEach((s: any) => { byObjective[s.objective] = s; });
      setScenarios(byObjective);
      setFetching(false);
    }).catch(() => setFetching(false));
  }, []);

  const runComparison = async () => {
    setLoading(true);
    try {
      const res = await compareScenarios({
        date_range_start: new Date().toISOString(),
        date_range_end: new Date(Date.now() + 14 * 86400000).toISOString(),
      });
      setScenarios(res.data.scenarios);
      setRecommended(res.data.recommended);
      setTradeOff(res.data.trade_off_analysis);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Comparison failed');
    }
    setLoading(false);
  };

  const objectiveKeys = Object.keys(scenarios);
  const scenarioList = objectiveKeys.map(k => ({ key: k, ...scenarios[k] }));

  // Radar data
  const radarData = [
    { metric: 'On-Time %', ...Object.fromEntries(objectiveKeys.map(k => [k, scenarios[k]?.on_time_percentage || 0])) },
    { metric: 'Machine Util', ...Object.fromEntries(objectiveKeys.map(k => [k, scenarios[k]?.machine_utilization || 0])) },
    { metric: 'Operator Util', ...Object.fromEntries(objectiveKeys.map(k => [k, scenarios[k]?.operator_utilization || 0])) },
    { metric: 'Low Overtime', ...Object.fromEntries(objectiveKeys.map(k => [k, Math.max(0, 100 - (scenarios[k]?.overtime_hours || 0) * 5)])) },
    { metric: 'Low Changeover', ...Object.fromEntries(objectiveKeys.map(k => [k, Math.max(0, 100 - (scenarios[k]?.changeover_hours || 0) * 8)])) },
    { metric: 'No Violations', ...Object.fromEntries(objectiveKeys.map(k => [k, (scenarios[k]?.constraint_violations || 0) === 0 ? 100 : Math.max(0, 100 - (scenarios[k]?.constraint_violations || 0) * 20)])) },
  ];

  // Bar comparison data
  const barData = [
    { metric: 'On-Time %', ...Object.fromEntries(objectiveKeys.map(k => [k, scenarios[k]?.on_time_percentage || 0])) },
    { metric: 'Overtime h', ...Object.fromEntries(objectiveKeys.map(k => [k, (scenarios[k]?.overtime_hours || 0) * 5])) }, // scaled
    { metric: 'Changeover h', ...Object.fromEntries(objectiveKeys.map(k => [k, (scenarios[k]?.changeover_hours || 0) * 10])) }, // scaled
  ];

  // Scatter: cost vs on-time trade-off
  const scatterData = scenarioList.map(s => ({
    name: SCENARIO_LABELS[s.key] || s.key,
    x: s.overtime_hours || 0,
    y: s.on_time_percentage || 0,
    color: SCENARIO_COLORS[s.key],
    recommended: s.key === recommended,
  }));

  const metrics = [
    { key: 'on_time_percentage', label: 'On-Time %', unit: '%', better: 'higher' },
    { key: 'late_orders_count', label: 'Late Orders', better: 'lower' },
    { key: 'total_tardiness_minutes', label: 'Tardiness (min)', better: 'lower' },
    { key: 'overtime_hours', label: 'Overtime (h)', better: 'lower' },
    { key: 'changeover_hours', label: 'Changeover (h)', better: 'lower' },
    { key: 'estimated_cost', label: 'Est. Cost (₹)', better: 'lower' },
    { key: 'estimated_energy_kwh', label: 'Energy (kWh)', better: 'lower' },
    { key: 'machine_utilization', label: 'Machine Util %', unit: '%', better: 'higher' },
    { key: 'operator_utilization', label: 'Operator Util %', unit: '%', better: 'higher' },
    { key: 'constraint_violations', label: 'Violations', better: 'lower' },
    { key: 'solve_time_seconds', label: 'Solve Time (s)', better: 'lower' },
  ];

  const getBest = (metricKey: string, better: string) => {
    if (objectiveKeys.length === 0) return '';
    const vals = objectiveKeys.map(k => ({ k, v: scenarios[k]?.[metricKey] ?? Infinity }));
    return better === 'higher' ? vals.reduce((a, b) => a.v > b.v ? a : b).k : vals.reduce((a, b) => a.v < b.v ? a : b).k;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Scenario Comparison</h1>
          <p className="section-subtitle">Compare all scheduling objectives side-by-side</p>
        </div>
        <button onClick={runComparison} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Running...</> : <><Play className="w-4 h-4" />Run All Scenarios</>}
        </button>
      </div>

      {fetching ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
      ) : objectiveKeys.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="font-medium text-slate-400">No scenarios generated yet</p>
          <p className="text-sm mt-1">Click "Run All Scenarios" or run individual schedules from the Scheduler page.</p>
        </div>
      ) : (
        <>
          {/* Recommended */}
          {recommended && (
            <div className="alert-success flex items-center gap-3">
              <Star className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="font-semibold">Recommended: {SCENARIO_LABELS[recommended]}</div>
                <div className="text-sm">{tradeOff?.delivery_vs_cost}</div>
              </div>
            </div>
          )}

          {/* Comparison cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scenarioList.map(s => {
              const isRec = s.key === recommended;
              return (
                <div key={s.key} className={`card p-5 relative ${isRec ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}>
                  {isRec && <div className="absolute top-3 right-3"><Star className="w-4 h-4 text-emerald-400 fill-emerald-400" /></div>}
                  <div className="mb-3">
                    <div className="w-2 h-2 rounded-full mb-2" style={{ background: SCENARIO_COLORS[s.key] }} />
                    <div className="text-sm font-bold text-white">{SCENARIO_LABELS[s.key]}</div>
                    <div className="text-xs text-slate-400">{s.objective}</div>
                  </div>
                  <div className={`text-3xl font-bold mb-1 ${s.on_time_percentage >= 90 ? 'text-emerald-400' : s.on_time_percentage >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                    {s.on_time_percentage?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mb-3">On-Time Delivery</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Overtime</span><span className="text-amber-400">{s.overtime_hours?.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Changeover</span><span className="text-purple-400">{s.changeover_hours?.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Violations</span><span className={s.constraint_violations === 0 ? 'text-emerald-400' : 'text-red-400'}>{s.constraint_violations}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Cost</span><span className="text-blue-400">₹{((s.estimated_cost || 0) / 1000).toFixed(1)}K</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Energy</span><span className="text-cyan-400">{s.estimated_energy_kwh?.toFixed(0)} kWh</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Performance Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                  {objectiveKeys.map(k => (
                    <Radar key={k} name={SCENARIO_LABELS[k]} dataKey={k}
                      stroke={SCENARIO_COLORS[k]} fill={SCENARIO_COLORS[k]} fillOpacity={0.15} />
                  ))}
                  <Legend formatter={v => SCENARIO_LABELS[v] || v} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Trade-off: Cost vs On-Time Delivery</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="x" name="Overtime Hours" label={{ value: 'Overtime (h)', position: 'bottom', fill: '#94a3b8', fontSize: 11 }} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="y" name="On-Time %" domain={[0, 100]} label={{ value: 'On-Time %', angle: -90, position: 'left', fill: '#94a3b8', fontSize: 11 }} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs">
                          <div className="font-bold text-white">{d?.name}</div>
                          <div>Overtime: {d?.x?.toFixed(1)}h</div>
                          <div>On-Time: {d?.y?.toFixed(1)}%</div>
                          {d?.recommended && <div className="text-emerald-400 mt-1">★ Recommended</div>}
                        </div>
                      );
                    }} />
                  <Scatter data={scatterData} shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={payload.recommended ? 10 : 7} fill={payload.color} fillOpacity={0.8} />
                        {payload.recommended && <circle cx={cx} cy={cy} r={14} fill="none" stroke={payload.color} strokeWidth={2} strokeDasharray="3 3" />}
                        <text x={cx + 12} y={cy + 4} fill="#94a3b8" fontSize={9} fontFamily="Inter">{payload.name?.split(' ')[0]}</text>
                      </g>
                    );
                  }} />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 text-center mt-2">Improving delivery performance increases overtime and changeover cost</p>
            </div>
          </div>

          {/* Detailed comparison table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-white">Detailed Metric Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="th">Metric</th>
                    {scenarioList.map(s => (
                      <th key={s.key} className="th" style={{ color: SCENARIO_COLORS[s.key] }}>
                        {SCENARIO_LABELS[s.key]}
                        {s.key === recommended && <span className="ml-1 text-emerald-400">★</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(m => {
                    const best = getBest(m.key, m.better);
                    return (
                      <tr key={m.key} className="table-row">
                        <td className="td font-medium text-slate-300">{m.label}</td>
                        {scenarioList.map(s => {
                          const val = s[m.key];
                          const isBest = s.key === best;
                          return (
                            <td key={s.key} className={`td font-mono ${isBest ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                              {typeof val === 'number' ? val.toFixed(val < 10 ? 2 : 1) : '—'}{m.unit || ''}
                              {isBest && <span className="ml-1 text-xs">✓</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stakeholder perspective */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 border-indigo-500/20">
              <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Stakeholder A — Production Manager
              </h3>
              <p className="text-xs text-slate-400 mb-3">Primary: On-Time Delivery, Throughput, Priority Fulfillment</p>
              {scenarios.delivery_first && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-300">On-Time %</span><span className="text-emerald-400 font-bold">{scenarios.delivery_first.on_time_percentage?.toFixed(1)}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-300">Late Orders</span><span className={scenarios.delivery_first.late_orders_count > 0 ? 'text-red-400' : 'text-emerald-400'}>{scenarios.delivery_first.late_orders_count}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-300">Constraint Violations</span><span className={scenarios.delivery_first.constraint_violations === 0 ? 'text-emerald-400' : 'text-red-400'}>{scenarios.delivery_first.constraint_violations}</span></div>
                  <div className="alert-success mt-2 text-xs">Recommended: Delivery First scenario maximizes on-time production</div>
                </div>
              )}
            </div>
            <div className="card p-5 border-emerald-500/20">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Stakeholder B — Operations/Finance Manager
              </h3>
              <p className="text-xs text-slate-400 mb-3">Primary: Minimize Cost, Overtime, Changeover, Energy</p>
              {scenarios.cost_first && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-300">Overtime</span><span className="text-amber-400 font-bold">{scenarios.cost_first.overtime_hours?.toFixed(1)}h</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-300">Changeover</span><span className="text-purple-400">{scenarios.cost_first.changeover_hours?.toFixed(1)}h</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-300">Energy</span><span className="text-cyan-400">{scenarios.cost_first.estimated_energy_kwh?.toFixed(0)} kWh</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-300">Est. Cost</span><span className="text-blue-400">₹{((scenarios.cost_first.estimated_cost || 0) / 1000).toFixed(1)}K</span></div>
                  <div className="alert-info mt-2 text-xs">Cost First reduces overtime but may sacrifice {scenarios.delivery_first && ((scenarios.delivery_first.on_time_percentage || 0) - (scenarios.cost_first.on_time_percentage || 0)).toFixed(1)}% on-time delivery</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
