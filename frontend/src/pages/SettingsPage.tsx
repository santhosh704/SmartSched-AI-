import React, { useState } from 'react';
import { Settings, Database, Server, Shield, Info, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const systemInfo = [
    { label: 'Backend Framework', value: 'FastAPI 0.111.0' },
    { label: 'Database', value: 'SQLite (dev) / PostgreSQL-compatible' },
    { label: 'ORM', value: 'SQLAlchemy 2.0' },
    { label: 'Auth', value: 'JWT (HS256) + bcrypt' },
    { label: 'Frontend', value: 'React 18 + Vite 5 + TypeScript' },
    { label: 'Styling', value: 'Tailwind CSS v3' },
    { label: 'Charts', value: 'Recharts 2' },
    { label: 'Scheduling Engine', value: 'Custom heuristic (CP-SAT compatible)' },
    { label: 'Python', value: '3.14' },
    { label: 'Node.js', value: '20.x' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">System configuration and project information</p>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-indigo-400" />Backend Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Backend API URL</label>
            <input className="input" value={backendUrl} onChange={e => setBackendUrl(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary">{saved ? '✓ Saved!' : 'Save Configuration'}</button>
            <a href={`${backendUrl}/docs`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <ExternalLink className="w-4 h-4" />OpenAPI Docs
            </a>
            <a href={`${backendUrl}/health`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <Info className="w-4 h-4" />Health Check
            </a>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-emerald-400" />System Information</h3>
        <div className="grid grid-cols-2 gap-3">
          {systemInfo.map(({ label, value }) => (
            <div key={label} className="flex justify-between p-3 bg-slate-700/30 rounded-lg text-sm">
              <span className="text-slate-400">{label}</span>
              <span className="font-medium text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400" />Project Information</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="font-medium text-indigo-400 mb-1">SmartSched AI — Constraint-Aware Production Scheduling</div>
            <div className="text-slate-400">COE Project — Indian MSME Discrete Manufacturing Context</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">Target Domain</div>
              <div className="font-medium">Electronics / PCB Assembly Manufacturing</div>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">Batch Type</div>
              <div className="font-medium">Small-batch, High-variant (HMLV)</div>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">Scheduling Model</div>
              <div className="font-medium">Flexible Job Shop (FJS)</div>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">Optimization</div>
              <div className="font-medium">Multi-objective (delivery, cost, changeover, energy)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
