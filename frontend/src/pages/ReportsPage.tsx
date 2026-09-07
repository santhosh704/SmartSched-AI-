import React, { useEffect, useState } from 'react';
import { getAllSchedules, exportSchedule, exportKPIs } from '../api/client';
import { FileDown, Download, ExternalLink, BarChart3, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  useEffect(() => { getAllSchedules().then(r => setSchedules(r.data)).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="section-title">Reports & Export</h1><p className="section-subtitle">Download schedule data and KPI reports</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-400" />KPI Summary Report</h3>
          <p className="text-sm text-slate-400 mb-4">Download all active scenario KPIs as CSV for analysis in Excel/Sheets</p>
          <a href={exportKPIs()} download className="btn-primary inline-flex"><Download className="w-4 h-4" />Download KPIs CSV</a>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" />API Documentation</h3>
          <p className="text-sm text-slate-400 mb-4">Full OpenAPI documentation for all backend endpoints</p>
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex"><ExternalLink className="w-4 h-4" />Open API Docs</a>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-700/50"><h3 className="text-sm font-bold text-white">Schedule Exports</h3></div>
        {schedules.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No schedules generated yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-700/30"><tr><th className="th">Schedule ID</th><th className="th">Objective</th><th className="th">On-Time %</th><th className="th">Created</th><th className="th">Export</th></tr></thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.schedule_id} className="table-row">
                  <td className="td font-mono text-indigo-400 text-xs">{s.schedule_id}</td>
                  <td className="td"><span className="badge-blue">{s.objective}</span></td>
                  <td className="td"><span className={s.on_time_percentage >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{s.on_time_percentage?.toFixed(1)}%</span></td>
                  <td className="td text-xs text-slate-400">{new Date(s.created_at).toLocaleString('en-IN')}</td>
                  <td className="td">
                    <a href={exportSchedule(s.schedule_id)} download className="btn-secondary text-xs py-1.5 inline-flex">
                      <FileDown className="w-3.5 h-3.5" />CSV
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
