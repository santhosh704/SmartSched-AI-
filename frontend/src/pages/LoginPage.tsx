import React, { useState } from 'react';
import { useAuth } from '../store/auth';
import { Factory, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const demoAccounts = [
  { role: 'Admin', username: 'admin', password: 'admin123', color: 'text-red-400', desc: 'Full system access' },
  { role: 'Production Manager', username: 'prod_manager', password: 'manager123', color: 'text-indigo-400', desc: 'Schedule approval, overrides' },
  { role: 'Planner', username: 'planner', password: 'planner123', color: 'text-blue-400', desc: 'Generate schedules' },
  { role: 'Operator', username: 'operator1', password: 'operator123', color: 'text-emerald-400', desc: 'View assigned work' },
  { role: 'Auditor', username: 'auditor', password: 'auditor123', color: 'text-amber-400', desc: 'Read-only audit access' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('prod_manager');
  const [password, setPassword] = useState('manager123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch {
      setError('Invalid credentials. Please check username and password.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left side — branding */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SmartSched AI</h1>
              <p className="text-xs text-indigo-400 font-medium">Production Intelligence Platform</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Constraint-Aware<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Production Scheduling
            </span>
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Feasible schedules for small-batch, high-variant manufacturing. 
            Built for Indian MSME discrete manufacturing.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: '30 Orders', desc: 'Real workload' },
              { label: '12 Constraints', desc: 'H1–H12 enforced' },
              { label: '4 Scenarios', desc: 'Compare objectives' },
              { label: 'Full Audit', desc: 'Every decision logged' },
            ].map(item => (
              <div key={item.label} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
                <div className="text-indigo-400 font-bold text-sm">{item.label}</div>
                <div className="text-slate-400 text-xs">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Demo accounts */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="space-y-1.5">
              {demoAccounts.map(acc => (
                <button
                  key={acc.username}
                  onClick={() => quickLogin(acc.username, acc.password)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/60 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${acc.color}`}>{acc.role}</span>
                      <span className="text-xs text-slate-500">@{acc.username}</span>
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-slate-400">{acc.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side — login form */}
        <div className="card-glass p-8 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-white mb-2">Sign In</h3>
          <p className="text-slate-400 text-sm mb-6">Access the production scheduling platform</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert-error flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-xs text-indigo-300 font-semibold mb-1">🎓 Academic Project Demo</p>
            <p className="text-xs text-slate-400">Click any demo account on the left to auto-fill credentials, then sign in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
