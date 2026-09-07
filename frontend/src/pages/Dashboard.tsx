import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import {
  ShoppingCart, CheckCircle2, AlertTriangle, Clock, Cpu, Users,
  Wrench, Zap, TrendingUp, TrendingDown, Package, Play, Loader2,
  FlaskConical, AlertCircle, BarChart2
} from 'lucide-react';
import { getMetrics, getOrders, getMachines, getOperators, getTools,
         getMaterials, getMaintenance, getErrors, runFullDemo } from '../api/client';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const PRIORITY_LABELS: Record<number, string> = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low', 5: 'Routine' };
const PRIORITY_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#3b82f6', 5: '#94a3b8' };

function KPICard({ title, value, subtitle, icon: Icon, color = 'indigo', trend, unit = '' }: any) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/20 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  };
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}{unit}</div>
      <div className="text-sm font-medium text-slate-300 mb-0.5">{title}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  const fetchData = async () => {
    try {
      const [metricsRes, ordersRes, matsRes, maintRes, errRes] = await Promise.allSettled([
        getMetrics('balanced'), getOrders(), getMaterials(), getMaintenance(), getErrors()
      ]);
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data);
      if (matsRes.status === 'fulfilled') setMaterials(matsRes.value.data);
      if (maintRes.status === 'fulfilled') setMaintenance(maintRes.value.data);
      if (errRes.status === 'fulfilled') setErrors(errRes.value.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const runDemo = async () => {
    setDemoRunning(true);
    setAlert(null);
    try {
      const res = await runFullDemo();
      setDemoResult(res.data);
      setAlert({ type: 'success', msg: `Demo complete! Delivery-first: ${res.data.summary.optimized_on_time}% on-time. Improvement: +${res.data.summary.improvement}%` });
      fetchData();
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.response?.data?.detail || 'Demo run failed. Is the backend running?' });
    } finally {
      setDemoRunning(false);
    }
  };

  // Compute order status distribution
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const priorityCounts: Record<string, number> = {};
  orders.forEach(o => { const p = PRIORITY_LABELS[o.priority] || 'Unknown'; priorityCounts[p] = (priorityCounts[p] || 0) + 1; });
  const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

  const lowStockMaterials = materials.filter(m => m.below_reorder);
  const upcomingMaint = maintenance.filter(m => new Date(m.start_time) > new Date()).slice(0, 3);

  const scenarioCompare = demoResult?.scenarios
    ? Object.entries(demoResult.scenarios).map(([obj, data]: any) => ({
        scenario: obj.replace('_', ' ').toUpperCase(),
        onTime: data.on_time_percentage,
        overtime: data.overtime_hours,
        violations: data.constraint_violations,
      }))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">SmartSched AI — Production Intelligence Platform</p>
        </div>
        <button onClick={runDemo} disabled={demoRunning} className="btn-primary bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20">
          {demoRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {demoRunning ? 'Running Demo...' : '▶ Run Complete Demonstration'}
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`${alert.type === 'success' ? 'alert-success' : 'alert-error'} flex items-center gap-2`}>
          {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{alert.msg}</span>
        </div>
      )}

      {/* No schedule warning */}
      {!metrics?.on_time_percentage && !demoRunning && (
        <div className="alert-info flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="font-medium">No schedule generated yet</div>
            <div className="text-xs mt-0.5">Click "Run Complete Demonstration" to generate all scheduling scenarios automatically, or go to the Scheduler page to generate manually.</div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Orders" value={orders.length} subtitle="Active workload" icon={ShoppingCart} color="indigo" />
        <KPICard title="On-Time %" value={metrics?.on_time_percentage?.toFixed(1) ?? '–'} subtitle={metrics ? `${metrics.on_time_orders}/${metrics.total_orders} orders` : 'Run scheduler'} icon={CheckCircle2} color="emerald" unit="%" />
        <KPICard title="Late Orders" value={metrics?.late_orders_count ?? '–'} subtitle={metrics ? `${metrics.total_tardiness_minutes?.toFixed(0)} min tardiness` : ''} icon={AlertTriangle} color="red" />
        <KPICard title="Constraint Violations" value={metrics?.constraint_violations ?? '–'} subtitle={metrics?.constraint_violations === 0 ? 'All hard constraints met ✓' : 'Review Constraint Center'} icon={AlertCircle} color={metrics?.constraint_violations === 0 ? 'emerald' : 'red'} />
        <KPICard title="Machine Utilization" value={metrics?.machine_utilization?.toFixed(1) ?? '–'} subtitle="Avg across all machines" icon={Cpu} color="blue" unit="%" />
        <KPICard title="Operator Utilization" value={metrics?.operator_utilization?.toFixed(1) ?? '–'} subtitle="Avg across all operators" icon={Users} color="purple" unit="%" />
        <KPICard title="Overtime Hours" value={metrics?.overtime_hours?.toFixed(1) ?? '–'} subtitle="Total across all operators" icon={Clock} color={metrics?.overtime_hours > 8 ? 'red' : 'amber'} />
        <KPICard title="Est. Energy" value={metrics?.estimated_energy_kwh?.toFixed(0) ?? '–'} subtitle="kWh consumption estimate" icon={Zap} color="emerald" unit=" kWh" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orders by Status */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Orders by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No orders loaded</div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Orders by Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[Object.keys(PRIORITY_LABELS).find(k => PRIORITY_LABELS[parseInt(k)] === entry.name) as any] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario comparison (after demo) */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Scenario On-Time Comparison</h3>
          {scenarioCompare.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scenarioCompare} barSize={28} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="scenario" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: any) => [`${v}%`, 'On-Time']} />
                <Bar dataKey="onTime" radius={[0, 4, 4, 0]}>
                  {scenarioCompare.map((entry, i) => (
                    <Cell key={i} fill={entry.onTime > 90 ? '#10b981' : entry.onTime > 80 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <BarChart2 className="w-8 h-8 text-slate-600" />
              <span>Run Demo to see scenario comparison</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Material Alerts */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Material Risk Alerts
            {lowStockMaterials.length > 0 && <span className="badge-red ml-1">{lowStockMaterials.length} below reorder</span>}
          </h3>
          {lowStockMaterials.length === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              All materials above reorder level
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockMaterials.slice(0, 5).map((m: any) => (
                <div key={m.material_id} className="flex items-center justify-between p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-amber-300">{m.material_name}</div>
                    <div className="text-xs text-slate-400">{m.supplier}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-400">{m.stock_quantity} {m.unit}</div>
                    <div className="text-xs text-slate-500">Reorder: {m.reorder_level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Upcoming */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-400" />
            Upcoming Maintenance
            {upcomingMaint.length > 0 && <span className="badge-blue ml-1">{upcomingMaint.length} scheduled</span>}
          </h3>
          {upcomingMaint.length === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              No active maintenance windows
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingMaint.map((m: any) => (
                <div key={m.maintenance_id} className="flex items-center justify-between p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-blue-300">{m.machine_name}</div>
                    <div className="text-xs text-slate-400">{m.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-blue-400">
                      {new Date(m.start_time).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(m.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error analysis */}
      {errors?.errors?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Schedule Error Analysis — Top Causes
          </h3>
          <div className="space-y-2">
            {errors.errors.slice(0, 5).map((e: any) => (
              <div key={e.cause} className="flex items-center gap-3">
                <div className="text-sm text-slate-300 w-40 truncate">{e.cause}</div>
                <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full transition-all duration-700" style={{ width: `${e.percentage}%` }} />
                </div>
                <div className="text-sm text-red-400 font-medium w-12 text-right">{e.count}</div>
                <div className="text-xs text-slate-500 w-10 text-right">{e.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Baseline vs Optimized */}
      {demoResult?.scenarios && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Baseline vs Optimized — Target Achievement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(demoResult.scenarios).map(([obj, data]: any) => (
              <div key={obj} className={`p-4 rounded-xl border ${data.on_time_percentage >= 90 ? 'border-emerald-500/30 bg-emerald-500/5' : data.on_time_percentage >= 80 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2">{obj.replace('_', ' ')}</div>
                <div className={`text-2xl font-bold mb-1 ${data.on_time_percentage >= 90 ? 'text-emerald-400' : data.on_time_percentage >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                  {data.on_time_percentage?.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">On-Time</div>
                <div className="mt-2 text-xs text-slate-400">OT: {data.overtime_hours?.toFixed(1)}h | CO: {data.changeover_hours?.toFixed(1)}h</div>
                <div className="mt-1">
                  {data.constraint_violations === 0
                    ? <span className="badge-green text-xs">✓ 0 violations</span>
                    : <span className="badge-red text-xs">{data.constraint_violations} violations</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
