import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  Shield,
  Briefcase,
  ChevronRight,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NotificationItem, UserRole } from '../../types';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ sidebarCollapsed }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const res = await api.notifications.getAll();
        if (res.data) {
          setNotifications(res.data.slice(0, 5));
          setUnreadCount(res.unread_count || 0);
        }
      } catch (e) {
        console.warn('Failed to load topbar notifications:', e);
      }
    };
    loadNotifs();
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  // Generate breadcrumb title
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Executive Underwriting Dashboard';
      case '/applicants': return 'Loan Applicants Directory';
      case '/new-application': return 'Originate Loan Application';
      case '/loans': return 'Loan Application Management';
      case '/predict': return 'AI Credit Risk & Underwriting Assessment';
      case '/predictions': return 'Machine Learning Prediction History';
      case '/analytics': return 'Portfolio Analytics & Risk Reports';
      case '/users': return 'Bank Officers & Security Administration';
      case '/notifications': return 'Underwriting Alerts & Notifications';
      case '/settings': return 'System & Institution Parameters';
      default: return 'SmartLender Portal';
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-300 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xs font-medium text-slate-400 hover:text-slate-600">
            SmartLender
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <h1 className="text-sm font-bold text-slate-800 tracking-tight">
            {getPageTitle(location.pathname)}
          </h1>
        </div>

        {/* Right Action Suite */}
        <div className="flex items-center gap-4">
          {/* Demo Role Switcher Bar */}
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-1">
            <span className="text-[10px] text-slate-500 font-semibold px-2 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Demo Role:
            </span>
            {(['admin', 'loan_manager', 'loan_officer'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchDemoRole(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  user?.role === r
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'admin' ? 'Admin' : r === 'loan_manager' ? 'Manager' : 'Officer'}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative hidden md:block w-52">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search apps or loans..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 text-xs rounded-lg border-transparent focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  navigate(`/loans?search=${encodeURIComponent(val)}`);
                }
              }}
            />
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No recent notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                          !n.is_read ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-800 mb-0.5">
                          <span className="truncate pr-2">{n.title}</span>
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-500 leading-relaxed text-[11px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 px-4 border-t border-slate-100 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-teal-700 font-semibold hover:underline"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A192F] text-teal-300 font-bold flex items-center justify-center text-xs border border-teal-500/30">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.full_name}</p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    {user?.department || 'Banking Staff'}
                  </span>
                </div>

                <div className="py-1 text-xs">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Profile Settings
                  </Link>
                  <Link
                    to="/analytics"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-slate-400" /> Portfolio Reports
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
