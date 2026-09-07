import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import {
  Factory, LayoutDashboard, ShoppingCart, Package, Server,
  Shield, Calendar, BarChart3, AlertTriangle, Leaf, Scale,
  Wrench, ClipboardList, FileDown, Settings, LogOut, ChevronLeft,
  ChevronRight, FlaskConical, BookOpen, Bell, User, Zap, Activity
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { label: 'Products & Routings', icon: Package, path: '/products' },
  { label: 'Resources', icon: Server, path: '/resources' },
  { label: 'Constraint Center', icon: Shield, path: '/constraints' },
  { divider: true, label: 'Scheduling' },
  { label: 'Scheduler', icon: Calendar, path: '/scheduler' },
  { label: 'Scenario Comparison', icon: BarChart3, path: '/scenarios' },
  { label: 'Bottlenecks', icon: Activity, path: '/bottlenecks' },
  { label: 'Error Analysis', icon: AlertTriangle, path: '/errors' },
  { label: 'Failure Lab', icon: FlaskConical, path: '/failure-lab' },
  { divider: true, label: 'Insights' },
  { label: 'Environmental', icon: Leaf, path: '/environment' },
  { label: 'Ethics & Fairness', icon: Scale, path: '/ethics' },
  { label: 'Maintenance', icon: Wrench, path: '/maintenance' },
  { label: 'Audit Log', icon: ClipboardList, path: '/audit' },
  { divider: true, label: 'Reports' },
  { label: 'Reports & Export', icon: FileDown, path: '/reports' },
  { label: 'Requirements', icon: BookOpen, path: '/requirements' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const roleColors: Record<string, string> = {
  admin: 'text-red-400',
  production_manager: 'text-indigo-400',
  planner: 'text-blue-400',
  operator: 'text-emerald-400',
  auditor: 'text-amber-400',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  production_manager: 'Production Manager',
  planner: 'Planner',
  operator: 'Operator',
  auditor: 'Auditor',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 sidebar-gradient border-r border-slate-800/80 flex flex-col transition-all duration-300 relative z-30`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30">
            <Factory className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white whitespace-nowrap">SmartSched AI</div>
              <div className="text-xs text-indigo-400 whitespace-nowrap">Production Intelligence</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              return (
                <div key={i} className={`${collapsed ? 'hidden' : ''} pt-4 pb-1`}>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">{item.label}</span>
                </div>
              );
            }
            const Icon = item.icon!;
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path!));
            return (
              <Link key={item.path} to={item.path!}>
                <div className={isActive ? 'sidebar-item-active' : 'sidebar-item'} title={collapsed ? item.label : undefined}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800/60">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40 mb-2">
              <div className="w-8 h-8 bg-indigo-600/30 border border-indigo-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.full_name}</div>
                <div className={`text-xs font-medium ${roleColors[user?.role || ''] || 'text-slate-400'}`}>
                  {roleLabels[user?.role || ''] || user?.role}
                </div>
              </div>
            </div>
          )}
          <button onClick={logout} className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Logout">
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors shadow-lg"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-slate-300" /> : <ChevronLeft className="w-3 h-3 text-slate-300" />}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-slate-900/80 border-b border-slate-800/60 px-6 py-3 flex items-center justify-between backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">System Online</span>
              <span>·</span>
              <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-slate-300 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className={`text-xs font-semibold ${roleColors[user?.role || ''] || 'text-slate-400'} bg-slate-800 px-3 py-1 rounded-full border border-slate-700`}>
              {roleLabels[user?.role || ''] || user?.role}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
