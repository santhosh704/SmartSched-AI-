import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const CONSTRAINTS = [
  { code: 'H1', name: 'Material Availability', category: 'Resource', severity: 'Hard',
    desc: 'Every scheduled operation must have sufficient raw material stock. Partial allocation is not permitted.',
    rule: 'stock_available[mat] - already_allocated[mat] >= qty_required[mat]',
    violation: 'Material shortage detected. Schedule marks operation as INFEASIBLE.',
    owner: 'Material Planner', impact: 'Production halt' },
  { code: 'H2', name: 'Machine Capacity (No Overlap)', category: 'Machine', severity: 'Hard',
    desc: 'No two operations can run on the same machine simultaneously. Strict single-machine capacity.',
    rule: '∀ machine m: ∑ (ops overlapping at time t on m) ≤ 1',
    violation: 'Machine double-booking. Second operation pushed to next available slot.',
    owner: 'Production Supervisor', impact: 'Quality defect' },
  { code: 'H3', name: 'Operator Skill Matching', category: 'Workforce', severity: 'Hard',
    desc: 'Assigned operator must possess all required skills at or above required proficiency level.',
    rule: '∀ op: skills[operator] ⊇ required_skills[routing_op] AND level[operator][skill] ≥ required_level',
    violation: 'Skill mismatch. Operator rejected; search continues for qualified replacement.',
    owner: 'HR / Training Manager', impact: 'Quality & Safety risk' },
  { code: 'H4', name: 'Machine Eligibility', category: 'Machine', severity: 'Hard',
    desc: 'Each operation has a list of eligible machine types. Only eligible machines can be assigned.',
    rule: '∀ assignment: machine_id ∈ eligible_machines[routing_op]',
    violation: 'Machine type mismatch. Machine rejected from candidate list.',
    owner: 'Process Engineer', impact: 'Equipment damage / Quality failure' },
  { code: 'H5', name: 'Operator Overtime Limit', category: 'Workforce', severity: 'Hard',
    desc: 'Operators cannot exceed their daily overtime limit (default: 2h above shift). Labour law compliance.',
    rule: 'daily_work_hours[operator] ≤ shift_hours + overtime_limit_hours[operator]',
    violation: 'Overtime limit would be exceeded. Operation delayed to next shift.',
    owner: 'HR Manager', impact: 'Legal / Labour compliance' },
  { code: 'H6', name: 'Routing Precedence', category: 'Process', severity: 'Hard',
    desc: 'Operations must be executed in routing sequence. Operation N can only start after N-1 completes.',
    rule: '∀ op[i]: start_time[op[i]] ≥ end_time[op[i-1]] for same order',
    violation: 'Predecessor not complete. Start time pushed past predecessor end.',
    owner: 'Process Engineer', impact: 'Process integrity failure' },
  { code: 'H7', name: 'Tool Capacity', category: 'Resource', severity: 'Hard',
    desc: 'Total simultaneous usage of each tool type cannot exceed the available quantity in the tool store.',
    rule: '∀ tool t at time τ: ∑ (concurrent uses of t) ≤ available_quantity[t]',
    violation: 'Tool unavailable. Operation queued until tool is released.',
    owner: 'Tool Store Manager', impact: 'Production delay' },
  { code: 'H8', name: 'Due Date Feasibility', category: 'Delivery', severity: 'Hard',
    desc: 'While the system cannot guarantee on-time delivery, it flags all operations where completion > due date.',
    rule: 'if end_time[last_op[order]] > due_date[order]: mark_late = True',
    violation: 'Order marked LATE. Tardiness computed for KPI reporting.',
    owner: 'Production Manager', impact: 'Customer penalty / Revenue loss' },
  { code: 'H9', name: 'Machine Maintenance Blocking', category: 'Machine', severity: 'Hard',
    desc: 'Mandatory maintenance windows must not be violated. Machines in maintenance cannot be assigned work.',
    rule: '∀ assignment: [start, end] ∩ maintenance_window[machine] = ∅ (if mandatory)',
    violation: 'Machine in maintenance. Start time pushed past maintenance end.',
    owner: 'Maintenance Manager', impact: 'Equipment failure' },
  { code: 'H10', name: 'Operator Shift Alignment', category: 'Workforce', severity: 'Hard',
    desc: 'Operations can only be assigned to operators whose shift covers the entire operation duration.',
    rule: '∀ assignment: [start, end] ⊆ [shift_start, shift_end] for assigned operator',
    violation: 'Operation extends outside operator shift. Different operator or time slot used.',
    owner: 'Shift Supervisor', impact: 'Safety & compliance risk' },
  { code: 'H11', name: 'Release Date Compliance', category: 'Process', severity: 'Hard',
    desc: 'No order can start production before its release date (material/design readiness).',
    rule: '∀ order: start_time[first_op[order]] ≥ release_date[order]',
    violation: 'Order not yet released. First operation delayed to release date.',
    owner: 'Engineering / Procurement', impact: 'Premature start with incomplete BOM' },
  { code: 'H12', name: 'Operator Uniqueness (No Overlap)', category: 'Workforce', severity: 'Hard',
    desc: 'One operator can only work on one operation at a time. No parallel assignments.',
    rule: '∀ operator o at time τ: ∑ (concurrent operations assigned to o) ≤ 1',
    violation: 'Operator conflict. Second assignment moved to next available time slot.',
    owner: 'Production Supervisor', impact: 'Quality & safety risk' },
];

const SOFT_CONSTRAINTS = [
  { code: 'S1', name: 'Minimize Tardiness', weight: 'delivery_weight', desc: 'Minimize total lateness (Σ max(0, end - due_date))' },
  { code: 'S2', name: 'Minimize Overtime Cost', weight: 'cost_weight', desc: 'Minimize Σ (overtime_hours × overtime_rate)' },
  { code: 'S3', name: 'Minimize Changeover Time', weight: 'changeover_weight', desc: 'Minimize Σ changeover_matrix[from_family, to_family] on same machine' },
  { code: 'S4', name: 'Minimize Energy Consumption', weight: 'energy_weight', desc: 'Minimize Σ machine_hours × energy_rate_kwh' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Resource: 'badge-blue', Machine: 'badge-purple', Workforce: 'badge-green',
  Process: 'badge-yellow', Delivery: 'badge-red'
};

export default function ConstraintsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Constraint Center</h1>
        <p className="section-subtitle">12 hard constraints (H1–H12) + 4 soft constraints with configurable weights</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Hard Constraints', value: 12, color: 'text-red-400' },
          { label: 'Soft Constraints', value: 4, color: 'text-amber-400' },
          { label: 'Resource Constraints', value: CONSTRAINTS.filter(c => c.category === 'Resource').length, color: 'text-blue-400' },
          { label: 'Workforce Constraints', value: CONSTRAINTS.filter(c => c.category === 'Workforce').length, color: 'text-emerald-400' },
          { label: 'Machine Constraints', value: CONSTRAINTS.filter(c => c.category === 'Machine').length, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Hard Constraints Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" /> Hard Constraints — Never Bypassed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONSTRAINTS.map(c => (
            <div
              key={c.code}
              className={`card p-5 cursor-pointer hover:border-indigo-500/30 transition-all ${selected === c.code ? 'border-indigo-500/40 bg-indigo-500/5' : ''}`}
              onClick={() => setSelected(selected === c.code ? null : c.code)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-red-400 text-sm">{c.code}</span>
                  </div>
                  <div>
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={CATEGORY_COLORS[c.category]}>{c.category}</span>
                      <span className="badge-red text-xs">Hard</span>
                    </div>
                  </div>
                </div>
                <span title="Active & Enforced"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" /></span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>

              {selected === c.code && (
                <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-4">
                  <div>
                    <div className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Formal Rule</div>
                    <div className="font-mono text-xs bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-indigo-300">{c.rule}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">When Violated</div>
                      <div className="text-amber-300">{c.violation}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Impact if Ignored</div>
                      <div className="text-red-300">{c.impact}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Constraint Owner</div>
                      <div className="text-slate-300">{c.owner}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Override Allowed?</div>
                      <div className="flex items-center gap-1 text-amber-300">
                        <AlertTriangle className="w-3 h-3" /> Only with Production Manager approval + audit log
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Soft Constraints */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" /> Soft Constraints — Weighted Objectives
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOFT_CONSTRAINTS.map(sc => (
            <div key={sc.code} className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-amber-400 text-sm">{sc.code}</span>
                </div>
                <div>
                  <div className="font-bold text-white">{sc.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="badge-yellow">Soft</span>
                    <span className="text-xs text-slate-400">Weight: {sc.weight}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-400">{sc.desc}</p>
              <div className="mt-3 text-xs text-slate-500">
                Configurable in Scheduler workspace → Balanced objective → Soft Constraint Weights sliders
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Override policy */}
      <div className="card p-5 border-amber-500/20 bg-amber-500/5">
        <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Constraint Override Policy
        </h3>
        <div className="text-sm text-slate-300 space-y-1.5">
          <div>• <strong>No silent bypass:</strong> All hard constraint violations generate INFEASIBLE status — never ignored</div>
          <div>• <strong>Override workflow:</strong> Planner → requests override → Production Manager approves/rejects → logged in audit</div>
          <div>• <strong>Full audit trail:</strong> Every override records: who, when, which constraint, reason, risk level</div>
          <div>• <strong>Risk classification:</strong> Low / Medium / High / Critical — determines approval authority</div>
          <div>• <strong>Roles:</strong> Admin & Production Manager can approve. Planners can only request. Operators read-only.</div>
        </div>
      </div>
    </div>
  );
}
