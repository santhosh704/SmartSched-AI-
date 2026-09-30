import React, { useState } from 'react';
import { runDisruption } from '../api/client';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const DISRUPTION_TYPES = [
  { id: 'MACHINE_BREAKDOWN', label: 'Machine Breakdown' },
  { id: 'OPERATOR_UNAVAILABLE', label: 'Operator Unavailable' },
  { id: 'MATERIAL_SHORTAGE', label: 'Material Shortage' }
];

export default function DisruptionExperiment() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [type, setType] = useState(DISRUPTION_TYPES[0].id);
  const [resourceId, setResourceId] = useState('M01');
  const [desc, setDesc] = useState('');

  const handleInject = async () => {
    setLoading(true);
    try {
      const res = await runDisruption({
        disruption_type: type,
        resource_id: resourceId,
        description: desc || 'Injected from UI'
      });
      setResult(res.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to inject disruption');
    }
    setLoading(false);
  };

  const getStatusColor = (diff: number, inverted: boolean = false) => {
    if (diff === 0) return 'text-slate-400';
    const isGood = inverted ? diff < 0 : diff > 0;
    return isGood ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-slate-900/50 border-orange-500/20">
        <h3 className="text-sm font-bold text-orange-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> 
          Inject Disruption
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Disruption Type</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white" value={type} onChange={e => setType(e.target.value)}>
              {DISRUPTION_TYPES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Resource ID</label>
            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white" value={resourceId} onChange={e => setResourceId(e.target.value)} placeholder="e.g. M01, OP01, STEEL-A" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Reason..." />
          </div>
        </div>
        <button onClick={handleInject} disabled={loading} className="btn-primary w-full md:w-auto">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Injecting...</> : 'Inject & Reschedule'}
        </button>
      </div>

      {result && (
        <div className="card p-6">
          <h3 className="text-sm font-bold text-white mb-4">KPI Impact Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">On-Time %</div>
              <div className="text-2xl font-bold">{result.after.on_time_percentage}%</div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${getStatusColor(result.kpi_diff.on_time_diff)}`}>
                {result.kpi_diff.on_time_diff > 0 ? <TrendingUp className="w-3 h-3" /> : result.kpi_diff.on_time_diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {result.kpi_diff.on_time_diff}% from {result.before.on_time_percentage}%
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Tardiness (min)</div>
              <div className="text-2xl font-bold">{result.after.total_tardiness_minutes}</div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${getStatusColor(result.kpi_diff.tardiness_diff, true)}`}>
                {result.kpi_diff.tardiness_diff > 0 ? <TrendingUp className="w-3 h-3" /> : result.kpi_diff.tardiness_diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {result.kpi_diff.tardiness_diff > 0 ? '+' : ''}{result.kpi_diff.tardiness_diff} from {result.before.total_tardiness_minutes}
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Cost (₹)</div>
              <div className="text-2xl font-bold">{result.after.estimated_cost}</div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${getStatusColor(result.kpi_diff.cost_diff, true)}`}>
                {result.kpi_diff.cost_diff > 0 ? <TrendingUp className="w-3 h-3" /> : result.kpi_diff.cost_diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {result.kpi_diff.cost_diff > 0 ? '+' : ''}{result.kpi_diff.cost_diff}
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Violations</div>
              <div className="text-2xl font-bold">{result.after.constraint_violations}</div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${getStatusColor(result.kpi_diff.violations_diff, true)}`}>
                {result.kpi_diff.violations_diff > 0 ? <TrendingUp className="w-3 h-3" /> : result.kpi_diff.violations_diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {result.kpi_diff.violations_diff > 0 ? '+' : ''}{result.kpi_diff.violations_diff}
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
            <strong>System Action:</strong> The scheduler adapted to the <em>{result.disruption.type}</em> on <strong>{result.disruption.resource}</strong> by re-routing orders, resulting in a {result.kpi_diff.on_time_diff}% change in delivery performance.
          </div>
        </div>
      )}
    </div>
  );
}
