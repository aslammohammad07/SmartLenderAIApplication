import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FilePlus2,
  BadgeDollarSign,
  Cpu,
  History,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Applicants', path: '/applicants', icon: Users },
    { name: 'New Application', path: '/new-application', icon: FilePlus2 },
    { name: 'Loan Management', path: '/loans', icon: BadgeDollarSign },
    { name: 'AI Prediction', path: '/predict', icon: Cpu, badge: 'AI ML' },
    { name: 'Prediction History', path: '/predictions', icon: History },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    ...(user?.role === 'admin' || user?.role === 'loan_manager'
      ? [{ name: 'User Management', path: '/users', icon: UserCog, roleLimit: 'Admin' }]
      : []),
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'loan_manager': return 'Loan Manager';
      case 'loan_officer': return 'Loan Officer';
      default: return 'Bank Staff';
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-[#0A192F] text-slate-200 border-r border-slate-800 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-[#071324]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-900/30 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white tracking-wide text-base">SmartLender<span className="text-teal-400">AI</span></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Enterprise Banking</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-teal-700/80 text-white shadow-sm shadow-teal-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate flex-1">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Section Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#071324]/80">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50">
          <div className="w-9 h-9 rounded-full bg-teal-800 text-teal-200 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-teal-600/40">
            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'SL'}
          </div>
          {!collapsed && (
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Officer'}</p>
              <p className="text-[10px] text-teal-400 font-medium truncate">{getRoleLabel(user?.role)}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
