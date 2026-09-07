import React, { useEffect, useState } from 'react';
import { getMachines, getOperators, getSkills, getTools, getMaterials, getMaintenance } from '../api/client';
import { Server, Users, Wrench, Package, Shield, Calendar, ChevronRight } from 'lucide-react';

const TABS = [
  { key: 'machines', label: 'Machines', icon: Server },
  { key: 'operators', label: 'Operators', icon: Users },
  { key: 'skills', label: 'Skills', icon: Shield },
  { key: 'tools', label: 'Tools', icon: Wrench },
  { key: 'materials', label: 'Materials', icon: Package },
  { key: 'maintenance', label: 'Maintenance', icon: Calendar },
];

const STATUS_COLORS: Record<string, string> = { active: 'badge-green', maintenance: 'badge-yellow', offline: 'badge-red' };
const SHIFT_COLORS: Record<string, string> = { morning: 'badge-blue', evening: 'badge-purple', night: 'badge-yellow' };

export default function ResourcesPage() {
  const [tab, setTab] = useState('machines');
  const [machines, setMachines] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMachines(), getOperators(), getSkills(), getTools(), getMaterials(), getMaintenance()])
      .then(([m, op, sk, t, mat, maint]) => {
        setMachines(m.data); setOperators(op.data); setSkills(sk.data);
        setTools(t.data); setMaterials(mat.data); setMaintenance(maint.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Resource Management</h1>
        <p className="section-subtitle">Machines, operators, skills, tools, materials, and maintenance</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center"><div className="w-8 h-8 spinner" /></div>
      ) : (
        <>
          {/* Machines */}
          {tab === 'machines' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map(m => (
                <div key={m.machine_id} className="card p-5 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-indigo-400 font-mono text-sm">{m.machine_id}</div>
                      <div className="font-medium text-white">{m.machine_name}</div>
                      <div className="text-xs text-slate-400">{m.work_center}</div>
                    </div>
                    <span className={STATUS_COLORS[m.status] || 'badge-blue'}>{m.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{m.description}</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {m.eligible_operations?.map((op: string) => <span key={op} className="badge-purple text-xs">{op}</span>)}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Energy Rate</span>
                    <span className="text-amber-400 font-medium">{m.energy_rate_kwh} kWh</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Operators */}
          {tab === 'operators' && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/30 border-b border-slate-700/50">
                  <tr>
                    <th className="th">ID</th><th className="th">Name</th><th className="th">Shift</th>
                    <th className="th">Skills</th><th className="th">OT Limit</th><th className="th">Rate</th><th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => (
                    <tr key={op.operator_id} className="table-row">
                      <td className="td font-mono text-indigo-400">{op.operator_id}</td>
                      <td className="td font-medium">{op.operator_name}</td>
                      <td className="td"><span className={SHIFT_COLORS[op.shift]}>{op.shift}</span></td>
                      <td className="td">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(op.skills || {}).map(([skill, level]: any) => (
                            <span key={skill} className="badge-blue text-xs">{skill} L{level}</span>
                          ))}
                        </div>
                      </td>
                      <td className="td text-amber-400">{op.overtime_limit_hours}h</td>
                      <td className="td text-emerald-400">₹{op.cost_per_hour}/h</td>
                      <td className="td"><span className={op.availability ? 'badge-green' : 'badge-red'}>{op.availability ? 'Available' : 'Unavailable'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Skills */}
          {tab === 'skills' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(s => (
                <div key={s.skill_id} className="card p-4 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{s.skill_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{s.skill_id}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{s.description}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Required Level</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(l => (
                        <div key={l} className={`w-5 h-2 rounded-full ${l <= s.level_required ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tools */}
          {tab === 'tools' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map(t => (
                <div key={t.tool_id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-amber-400 font-mono text-sm">{t.tool_id}</div>
                      <div className="font-medium text-white">{t.tool_name}</div>
                      <div className="text-xs text-slate-400">{t.tool_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{t.available_quantity}/{t.total_quantity}</div>
                      <div className="text-xs text-slate-400">available</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{t.description}</div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(t.available_quantity / t.total_quantity) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Materials */}
          {tab === 'materials' && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/30 border-b border-slate-700/50">
                  <tr>
                    <th className="th">ID</th><th className="th">Material</th><th className="th">Stock</th>
                    <th className="th">Reorder Level</th><th className="th">Lead Time</th><th className="th">Supplier</th><th className="th">Cost</th><th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(m => (
                    <tr key={m.material_id} className="table-row">
                      <td className="td font-mono text-blue-400">{m.material_id}</td>
                      <td className="td font-medium">{m.material_name}</td>
                      <td className="td">
                        <div className="font-bold">{m.stock_quantity}</div>
                        <div className="text-xs text-slate-400">{m.unit}</div>
                      </td>
                      <td className="td text-slate-400">{m.reorder_level} {m.unit}</td>
                      <td className="td text-slate-400">{m.lead_time_days} days</td>
                      <td className="td text-xs text-slate-400">{m.supplier}</td>
                      <td className="td text-emerald-400">₹{m.cost_per_unit}/{m.unit}</td>
                      <td className="td">
                        {m.below_reorder
                          ? <span className="badge-red">⚠ Low Stock</span>
                          : <span className="badge-green">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Maintenance */}
          {tab === 'maintenance' && (
            <div className="space-y-3">
              {maintenance.length === 0 ? (
                <div className="card p-12 text-center text-slate-500">No maintenance windows configured</div>
              ) : maintenance.map(mw => {
                const now = new Date();
                const start = new Date(mw.start_time);
                const end = new Date(mw.end_time);
                const isActive = start <= now && end >= now;
                const isUpcoming = start > now;
                const isPast = end < now;
                return (
                  <div key={mw.maintenance_id} className={`card p-5 ${isActive ? 'border-red-500/30 bg-red-500/5' : isUpcoming ? 'border-amber-500/20' : 'opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-red-500/20' : isUpcoming ? 'bg-amber-500/20' : 'bg-slate-700'}`}>
                          <Wrench className={`w-5 h-5 ${isActive ? 'text-red-400' : isUpcoming ? 'text-amber-400' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{mw.machine_name}</span>
                            <span className="font-mono text-xs text-slate-400">{mw.machine_id}</span>
                            {mw.mandatory && <span className="badge-red text-xs">Mandatory</span>}
                          </div>
                          <div className="text-sm text-slate-300">{mw.description}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(mw.start_time).toLocaleString('en-IN')} → {new Date(mw.end_time).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={isActive ? 'badge-red' : isUpcoming ? 'badge-yellow' : 'status-completed'}>
                          {isActive ? '● ACTIVE' : isUpcoming ? '⏱ Upcoming' : '✓ Complete'}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">{mw.maintenance_type}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
