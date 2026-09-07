import React, { useEffect, useState } from 'react';
import { getRequirementCoverage } from '../api/client';
import { CheckCircle2, XCircle, BookOpen, Loader2 } from 'lucide-react';

export default function RequirementsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRequirementCoverage().then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const reqs = data?.requirements || [];
  const met = reqs.filter((r: any) => r.met).length;
  const total = reqs.length;
  const pct = total > 0 ? Math.round((met / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Requirement Coverage</h1>
        <p className="section-subtitle">Live verification of all project requirements against the running system</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5 text-center col-span-2">
              <div className={`text-5xl font-bold mb-2 ${pct === 100 ? 'text-emerald-400' : pct >= 90 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</div>
              <div className="text-slate-300 font-medium">Requirements Met</div>
              <div className="text-slate-400 text-sm">{met} / {total} verified</div>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="card p-5 text-center"><div className="text-3xl font-bold text-emerald-400">{met}</div><div className="text-slate-400">Implemented</div></div>
            <div className="card p-5 text-center"><div className={`text-3xl font-bold ${total - met > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{total - met}</div><div className="text-slate-400">Pending</div></div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white">Live Requirement Status</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="th">Requirement</th>
                  <th className="th">Feature</th>
                  <th className="th">Status</th>
                  <th className="th">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {reqs.map((r: any, i: number) => (
                  <tr key={i} className="table-row">
                    <td className="td text-slate-300 font-medium">{r.req}</td>
                    <td className="td text-indigo-400">{r.feature}</td>
                    <td className="td">
                      <div className="flex items-center gap-1.5">
                        {r.met
                          ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="badge-green">Implemented</span></>
                          : <><XCircle className="w-4 h-4 text-red-400" /><span className="badge-red">Pending</span></>}
                      </div>
                    </td>
                    <td className="td text-xs text-slate-400">{r.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
