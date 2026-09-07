import React, { useEffect, useState, useRef } from 'react';
import { generateSchedule, getAllSchedules, getGanttData, getScheduleAssignments } from '../api/client';
import { Play, Loader2, RefreshCw, Calendar, X, Info, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { format, addMinutes, differenceInMinutes, parseISO } from 'date-fns';

const OBJECTIVES = [
  { value: 'baseline', label: 'Baseline (FIFO)', desc: 'No constraints — simulates current practice', color: '#94a3b8' },
  { value: 'delivery_first', label: 'Delivery First', desc: 'Minimize tardiness (EDD)', color: '#6366f1' },
  { value: 'cost_first', label: 'Cost First', desc: 'Minimize overtime & changeover', color: '#10b981' },
  { value: 'balanced', label: 'Balanced', desc: 'Weighted objective function', color: '#f59e0b' },
];

const TASK_COLORS: Record<string, string> = {
  feasible: '#6366f1',
  infeasible: '#ef4444',
  overridden: '#f59e0b',
  maintenance: '#475569',
  changeover: '#7c3aed',
};

function GanttChart({ ganttData, scheduleStart }: { ganttData: any[], scheduleStart: string }) {
  const [tooltip, setTooltip] = useState<{ task: any; x: number; y: number } | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!ganttData || ganttData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <div>No schedule data. Generate a schedule first.</div>
        </div>
      </div>
    );
  }

  const baseStart = parseISO(scheduleStart);
  const allTasks = ganttData.flatMap(row => row.tasks);
  const scheduleEnd = allTasks.length > 0
    ? new Date(Math.max(...allTasks.map(t => parseISO(t.end).getTime())))
    : addMinutes(baseStart, 480);

  const totalMinutes = Math.max(differenceInMinutes(scheduleEnd, baseStart), 480);
  const pixelsPerMinute = 2.5;
  const rowHeight = 52;
  const labelWidth = 180;
  const timelineWidth = totalMinutes * pixelsPerMinute;

  // Generate hour marks
  const hourMarks = [];
  for (let m = 0; m <= totalMinutes; m += 60) {
    const ts = addMinutes(baseStart, m);
    hourMarks.push({ m, label: format(ts, 'MMM dd HH:mm') });
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="gantt-container border border-slate-700/50 rounded-xl overflow-auto">
        <svg
          width={labelWidth + timelineWidth + 20}
          height={ganttData.length * rowHeight + 50}
          className="block"
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="#0f172a" rx="12" />

          {/* Row backgrounds */}
          {ganttData.map((row, i) => (
            <rect key={row.machine_id} x={0} y={50 + i * rowHeight} width="100%" height={rowHeight}
              fill={i % 2 === 0 ? 'rgba(30,41,59,0.4)' : 'rgba(15,23,42,0.4)'} />
          ))}

          {/* Hour marks */}
          {hourMarks.map(({ m, label }) => (
            <g key={m}>
              <line x1={labelWidth + m * pixelsPerMinute} y1={0} x2={labelWidth + m * pixelsPerMinute} y2="100%"
                stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
              <text x={labelWidth + m * pixelsPerMinute + 3} y={18} fill="#64748b" fontSize={9} fontFamily="JetBrains Mono, monospace">
                {label}
              </text>
            </g>
          ))}

          {/* Machine labels */}
          {ganttData.map((row, i) => (
            <g key={row.machine_id}>
              <rect x={0} y={50 + i * rowHeight} width={labelWidth} height={rowHeight} fill="rgba(15,23,42,0.9)" />
              <text x={8} y={50 + i * rowHeight + 18} fill="#94a3b8" fontSize={11} fontWeight="600" fontFamily="Inter, sans-serif">
                {row.machine_id}
              </text>
              <text x={8} y={50 + i * rowHeight + 32} fill="#64748b" fontSize={9} fontFamily="Inter, sans-serif">
                {row.machine_name?.slice(0, 22)}
              </text>
            </g>
          ))}

          {/* Task bars */}
          {ganttData.map((row, rowIdx) =>
            row.tasks.map((task: any) => {
              const taskStart = parseISO(task.start);
              const taskEnd = parseISO(task.end);
              const x = labelWidth + differenceInMinutes(taskStart, baseStart) * pixelsPerMinute;
              const w = Math.max(differenceInMinutes(taskEnd, taskStart) * pixelsPerMinute, 4);
              const y = 50 + rowIdx * rowHeight + 6;
              const h = rowHeight - 12;
              const isLate = task.due_date && task.end > task.due_date;
              const color = isLate && task.status === 'feasible'
                ? '#f59e0b'
                : TASK_COLORS[task.status] || TASK_COLORS.feasible;

              return (
                <g key={task.id} className="gantt-task"
                  onMouseEnter={e => setTooltip({ task, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Bar */}
                  <rect x={x} y={y} width={w} height={h} rx={4} fill={color} fillOpacity={0.85} />
                  {/* Overtime indicator */}
                  {task.is_overtime && (
                    <rect x={x + w - 4} y={y} width={4} height={h} rx={2} fill="#dc2626" />
                  )}
                  {/* Label */}
                  {w > 40 && (
                    <text x={x + 4} y={y + h / 2 + 1} fill="white" fontSize={9} fontFamily="Inter, sans-serif"
                      dominantBaseline="middle" clipPath={`inset(0 0 0 0 round 4px)`}>
                      {task.order_id} · {task.operation?.slice(0, 12)}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Legend */}
          <g transform="translate(0, 26)">
            {[
              { color: '#6366f1', label: 'On-Time' },
              { color: '#f59e0b', label: 'At-Risk/Late' },
              { color: '#ef4444', label: 'Infeasible' },
              { color: '#dc2626', label: 'Overtime' },
            ].map(({ color, label }, i) => (
              <g key={label} transform={`translate(${labelWidth + i * 100 + 10}, 0)`}>
                <rect width={12} height={8} rx={2} fill={color} />
                <text x={16} y={7} fill="#94a3b8" fontSize={9} fontFamily="Inter, sans-serif">{label}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs pointer-events-none max-w-72"
          style={{ left: tooltip.x + 10, top: tooltip.y - 20 }}>
          <div className="font-bold text-white mb-1">{tooltip.task.order_id} — {tooltip.task.operation}</div>
          <div className="text-slate-400">{tooltip.task.customer}</div>
          <div className="text-slate-300 mt-1">Start: {format(parseISO(tooltip.task.start), 'dd MMM HH:mm')}</div>
          <div className="text-slate-300">End: {format(parseISO(tooltip.task.end), 'dd MMM HH:mm')}</div>
          <div className="text-slate-400">Operator: {tooltip.task.operator || '—'}</div>
          <div className={`mt-1 font-semibold ${tooltip.task.status === 'feasible' ? 'text-emerald-400' : 'text-red-400'}`}>
            {tooltip.task.status?.toUpperCase()}
          </div>
        </div>
      )}

      {/* Assignment detail modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Operation Detail</h3>
              <button onClick={() => setSelectedTask(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Order ID', selectedTask.order_id],
                ['Customer', selectedTask.customer],
                ['Product', selectedTask.product_id],
                ['Operation', selectedTask.operation],
                ['Operator', selectedTask.operator || '—'],
                ['Start Time', selectedTask.start ? format(parseISO(selectedTask.start), 'dd MMM yyyy HH:mm') : '—'],
                ['End Time', selectedTask.end ? format(parseISO(selectedTask.end), 'dd MMM yyyy HH:mm') : '—'],
                ['Due Date', selectedTask.due_date ? format(parseISO(selectedTask.due_date), 'dd MMM yyyy HH:mm') : '—'],
                ['Overtime', selectedTask.is_overtime ? '⚠ Yes' : 'No'],
                ['Status', selectedTask.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-slate-400 text-xs">{label}</div>
                  <div className={`font-medium ${label === 'Status' ? (selectedTask.status === 'feasible' ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-slate-700/40 rounded-lg">
              <div className="text-xs font-semibold text-slate-400 mb-1">FEASIBILITY STATUS</div>
              <div className="flex items-center gap-2">
                {selectedTask.status === 'feasible'
                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 font-medium text-sm">FEASIBLE — All hard constraints satisfied</span></>
                  : <><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-red-400 font-medium text-sm">INFEASIBLE — Constraint violation detected</span></>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedObjective, setSelectedObjective] = useState('balanced');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [dateStart, setDateStart] = useState(new Date().toISOString().slice(0, 16));
  const [dateEnd, setDateEnd] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16));
  const [weights, setWeights] = useState({ delivery: 0.5, cost: 0.2, changeover: 0.15, energy: 0.15 });
  const [showDetail, setShowDetail] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<any>(null);

  const fetchSchedules = async () => {
    try {
      const res = await getAllSchedules();
      setSchedules(res.data);
      const match = res.data.find((s: any) => s.objective === selectedObjective);
      if (match) await loadGantt(match.schedule_id);
      setSelectedSchedule(match || res.data[0] || null);
    } catch {}
    setLoading(false);
  };

  const loadGantt = async (scheduleId: string) => {
    try {
      const [ganttRes, assignRes] = await Promise.all([getGanttData(scheduleId), getScheduleAssignments(scheduleId)]);
      setGanttData(ganttRes.data);
      setAssignments(assignRes.data);
    } catch {}
  };

  useEffect(() => { fetchSchedules(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateSchedule({
        objective: selectedObjective,
        date_range_start: dateStart,
        date_range_end: dateEnd,
        soft_weights: weights
      });
      await fetchSchedules();
      await loadGantt(res.data.schedule_id);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Schedule generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const currentSchedule = schedules.find(s => s.objective === selectedObjective) || selectedSchedule;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Scheduler Workspace</h1>
          <p className="section-subtitle">Generate and visualize constraint-aware production schedules</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Objective</label>
            <select className="input" value={selectedObjective} onChange={e => setSelectedObjective(e.target.value)}>
              {OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="text-xs text-slate-500 mt-1">{OBJECTIVES.find(o => o.value === selectedObjective)?.desc}</p>
          </div>
          <div>
            <label className="label">From Date</label>
            <input className="input" type="datetime-local" value={dateStart} onChange={e => setDateStart(e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input className="input" type="datetime-local" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full justify-center py-2.5">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Scheduling...</> : <><Play className="w-4 h-4" />Generate Schedule</>}
            </button>
          </div>
        </div>

        {/* Soft weights (only for balanced) */}
        {selectedObjective === 'balanced' && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Soft Constraint Weights</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-400 capitalize">{key}</span>
                    <span className="text-xs font-bold text-indigo-400">{(val * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={val * 100}
                    onChange={e => setWeights({ ...weights, [key]: parseFloat(e.target.value) / 100 })} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Objective selector tabs */}
        <div className="flex flex-wrap gap-2">
          {schedules.map(s => (
            <button key={s.schedule_id} onClick={async () => { setSelectedSchedule(s); setSelectedObjective(s.objective); await loadGantt(s.schedule_id); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${s.objective === selectedObjective ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {OBJECTIVES.find(o => o.value === s.objective)?.label || s.objective}
              <span className={`ml-2 ${s.on_time_percentage >= 90 ? 'text-emerald-400' : s.on_time_percentage >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                {s.on_time_percentage?.toFixed(0)}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      {currentSchedule && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'On-Time', value: `${currentSchedule.on_time_percentage?.toFixed(1)}%`, color: currentSchedule.on_time_percentage >= 90 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Late Orders', value: currentSchedule.late_orders_count, color: currentSchedule.late_orders_count > 0 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Overtime', value: `${currentSchedule.overtime_hours?.toFixed(1)}h`, color: 'text-amber-400' },
            { label: 'Changeover', value: `${currentSchedule.changeover_hours?.toFixed(1)}h`, color: 'text-purple-400' },
            { label: 'Violations', value: currentSchedule.constraint_violations, color: currentSchedule.constraint_violations === 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Solve Time', value: `${currentSchedule.solve_time_seconds?.toFixed(2)}s`, color: 'text-blue-400' },
          ].map(kpi => (
            <div key={kpi.label} className="card p-3 text-center">
              <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-slate-400">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gantt Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Production Gantt Chart</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any task bar for operation details</p>
          </div>
          {currentSchedule && (
            <div className="flex items-center gap-2">
              {currentSchedule.constraint_violations === 0
                ? <span className="badge-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Feasible Schedule</span>
                : <span className="badge-red flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {currentSchedule.constraint_violations} Violations</span>}
              <span className="badge-blue flex items-center gap-1"><Zap className="w-3 h-3" />{currentSchedule.solve_time_seconds?.toFixed(2)}s</span>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        ) : (
          <GanttChart ganttData={ganttData} scheduleStart={dateStart} />
        )}
      </div>

      {/* Assignment table */}
      {assignments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-sm font-bold text-white">Resource Assignments — {assignments.length} operations</h3>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                <tr>
                  <th className="th">Order</th>
                  <th className="th">Operation</th>
                  <th className="th">Machine</th>
                  <th className="th">Operator</th>
                  <th className="th">Tools</th>
                  <th className="th">Start</th>
                  <th className="th">End</th>
                  <th className="th">Status</th>
                  <th className="th">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.assignment_id} className="table-row cursor-pointer" onClick={() => setDetailAssignment(a)}>
                    <td className="td font-mono text-indigo-400">{a.order_id}</td>
                    <td className="td">{a.operation_name}<div className="text-xs text-slate-500">Seq #{a.sequence}</div></td>
                    <td className="td text-xs">{a.machine_id}<div className="text-slate-500">{a.machine_name?.slice(0, 20)}</div></td>
                    <td className="td text-xs">{a.operator_name || '—'}</td>
                    <td className="td"><div className="flex flex-wrap gap-1">{a.tool_ids?.map((t: string) => <span key={t} className="badge-yellow text-xs">{t}</span>)}</div></td>
                    <td className="td text-xs font-mono">{a.start_time ? format(parseISO(a.start_time), 'dd/MM HH:mm') : '—'}</td>
                    <td className="td text-xs font-mono">{a.end_time ? format(parseISO(a.end_time), 'dd/MM HH:mm') : '—'}</td>
                    <td className="td"><span className={a.status === 'feasible' ? 'status-feasible' : a.status === 'infeasible' ? 'status-infeasible' : 'status-overridden'}>{a.status}</span></td>
                    <td className="td text-xs text-slate-400 max-w-48 truncate" title={a.explanation}>{a.explanation?.slice(0, 50)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detailAssignment && (
        <div className="modal-overlay" onClick={() => setDetailAssignment(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">Assignment Detail</h3>
              <button onClick={() => setDetailAssignment(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              {[
                ['Order', detailAssignment.order_id],
                ['Customer', detailAssignment.customer_name],
                ['Product', detailAssignment.product_id],
                ['Operation', detailAssignment.operation_name],
                ['Sequence', `#${detailAssignment.sequence}`],
                ['Machine', `${detailAssignment.machine_id} — ${detailAssignment.machine_name}`],
                ['Operator', detailAssignment.operator_name || '—'],
                ['Duration', `${detailAssignment.duration_minutes} min`],
                ['Changeover', `${detailAssignment.changeover_minutes} min`],
                ['Overtime', detailAssignment.is_overtime ? '⚠ Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label}><div className="text-slate-400 text-xs">{label}</div><div className="font-medium text-white">{value}</div></div>
              ))}
            </div>
            <div className={`p-3 rounded-lg mb-3 ${detailAssignment.status === 'feasible' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="text-xs font-bold mb-1 flex items-center gap-2">
                {detailAssignment.status === 'feasible'
                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">FEASIBLE — All constraints satisfied</span></>
                  : <><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-red-400">INFEASIBLE — Constraint violation</span></>}
              </div>
              {detailAssignment.constraint_violations?.map((v: string, i: number) => (
                <div key={i} className="text-xs text-red-300 mt-1">• {v}</div>
              ))}
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> WHY THIS ASSIGNMENT?</div>
              <p className="text-xs text-slate-300 leading-relaxed">{detailAssignment.explanation}</p>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {detailAssignment.tool_ids?.map((t: string) => <span key={t} className="badge-yellow">{t}</span>)}
              {Object.entries(detailAssignment.material_allocations || {}).map(([id, qty]: any) => (
                <span key={id} className="badge-blue">{id}: {qty}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
