import React, { useEffect, useState } from 'react';
import { getAuditLog, getOverrides, approveOverride } from '../api/client';
import { ClipboardList, Shield, CheckCircle2, XCircle, Loader2, Filter } from 'lucide-react';
import { useAuth } from '../store/auth';

const RISK_COLORS: Record<string, string> = { low: 'badge-green', medium: 'badge-yellow', high: 'badge-red', critical: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30' };
const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-blue-400', GENERATE_SCHEDULE: 'text-indigo-400', COMPARE_SCENARIOS: 'text-purple-400',
  CREATE_ORDER: 'text-emerald-400', UPDATE_ORDER: 'text-amber-400', CANCEL_ORDER: 'text-red-400',
  REQUEST_OVERRIDE: 'text-orange-400', OVERRIDE_APPROVE: 'text-emerald-400', OVERRIDE_REJECT: 'text-red-400',
  DEMO_RUN: 'text-cyan-400'
};

export default function AuditPage() {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'audit' | 'overrides'>('audit');
  const [actionFilter, setActionFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [logsRes, overridesRes] = await Promise.allSettled([getAuditLog({ limit: 200 }), getOverrides()]);
    if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data);
    if (overridesRes.status === 'fulfilled') setOverrides(overridesRes.value.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleOverrideAction = async (id: number, action: string) => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this override?`)) return;
    await approveOverride(id, action);
    fetchData();
  };

  const filteredLogs = logs.filter(l => !actionFilter || l.action.includes(actionFilter.toUpperCase()));
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Audit Log & Overrides</h1>
        <p className="section-subtitle">Complete immutable record of all system actions and constraint overrides</p>
      </div>

      <div className="flex gap-2">
        {(['audit', 'overrides'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {t === 'audit' ? <ClipboardList className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {t === 'audit' ? `Audit Log (${logs.length})` : `Overrides (${overrides.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
      ) : tab === 'audit' ? (
        <>
          <div className="flex gap-3">
            <select className="input max-w-56" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="text-sm text-slate-400 self-center">{filteredLogs.length} entries</div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto max-h-[65vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                  <tr>
                    <th className="th">Timestamp</th><th className="th">User</th><th className="th">Action</th>
                    <th className="th">Entity</th><th className="th">Details</th><th className="th">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="table-row text-xs">
                      <td className="td font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="td font-medium text-indigo-400">{log.username}</td>
                      <td className={`td font-bold ${ACTION_COLORS[log.action] || 'text-slate-300'}`}>{log.action}</td>
                      <td className="td">
                        {log.entity_type && <span className="badge-blue mr-1">{log.entity_type}</span>}
                        <span className="text-slate-400 font-mono">{log.entity_id?.slice(0, 16)}</span>
                      </td>
                      <td className="td text-slate-400 max-w-64 truncate" title={log.details}>{log.details?.slice(0, 60)}</td>
                      <td className="td"><span className={RISK_COLORS[log.risk_level] || 'badge-blue'}>{log.risk_level || 'low'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {overrides.length === 0 ? (
            <div className="card p-12 text-center text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No constraint overrides requested yet</p>
            </div>
          ) : overrides.map(ov => (
            <div key={ov.id} className={`card p-5 ${ov.status === 'pending' ? 'border-amber-500/20' : ov.status === 'approved' ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-white font-mono">{ov.constraint_code}</span>
                    <span className={RISK_COLORS[ov.risk_level] || 'badge-blue'}>{ov.risk_level} risk</span>
                    <span className={ov.status === 'pending' ? 'badge-yellow' : ov.status === 'approved' ? 'badge-green' : 'badge-red'}>{ov.status}</span>
                  </div>
                  <div className="text-sm text-slate-300 mb-1">{ov.description}</div>
                  <div className="text-xs text-slate-400 mb-2"><strong>Reason:</strong> {ov.reason}</div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Requested by: <span className="text-slate-300">{ov.requested_by}</span></span>
                    {ov.approved_by && <span>Resolved by: <span className="text-slate-300">{ov.approved_by}</span></span>}
                    <span>{new Date(ov.created_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {ov.status === 'pending' && hasRole(['admin', 'production_manager']) && (
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleOverrideAction(ov.id, 'approve')} className="btn-success text-xs py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => handleOverrideAction(ov.id, 'reject')} className="btn-danger text-xs py-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
