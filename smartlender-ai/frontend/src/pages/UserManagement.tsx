import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Shield,
  Briefcase,
  Mail,
  Lock,
  CheckCircle,
  XCircle,
  Activity,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { User, AuditLogItem, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: 'Password@123',
    role: 'loan_officer' as UserRole,
    department: 'Retail Lending'
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchUsersAndLogs = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes] = await Promise.all([
        api.users.getAll(),
        api.users.getActivity()
      ]);
      if (usersRes?.data) setUsers(usersRes.data);
      if (logsRes?.data) setActivityLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndLogs();
  }, []);

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.users.create(formData);
      setCreateModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        password: 'Password@123',
        role: 'loan_officer',
        department: 'Retail Lending'
      });
      fetchUsersAndLogs();
    } catch (err: any) {
      alert(`User provisioning failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await api.users.toggleStatus(userId);
      fetchUsersAndLogs();
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="gold">Administrator</Badge>;
      case 'loan_manager': return <Badge variant="teal">Loan Manager</Badge>;
      default: return <Badge variant="info">Loan Officer</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6 text-teal-700" />
            <span>Bank Officers & Security Administration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision officer credentials, designate underwriting roles, and audit access security logs.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Officer Account</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Active Staff Roster ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Underwriting Audit Trail</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading bank authorization directory..." />
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Officer Name</th>
                  <th className="py-3 px-5">Work Email</th>
                  <th className="py-3 px-5">Security Role</th>
                  <th className="py-3 px-5">Department</th>
                  <th className="py-3 px-5">Account Status</th>
                  <th className="py-3 px-5">Last Terminal Login</th>
                  {currentUser?.role === 'admin' && (
                    <th className="py-3 px-5 text-right">Access Control</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-300 font-bold flex items-center justify-center text-xs">
                        {u.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{u.full_name}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {u.department}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                        {u.status === 'active' ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never logged in'}
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td className="py-3.5 px-5 text-right">
                        {u.id !== currentUser.id ? (
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                              u.status === 'active'
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Self (Admin)</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Activity Audit Trail */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Real-time Cryptographic Audit Records</span>
            <span className="text-[11px] text-slate-500">All loan decisions, logins, and profile mutations</span>
          </div>

          <div className="divide-y divide-slate-100">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-4 text-xs hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-slate-600 font-semibold">{log.user_name}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provision Officer Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Provision New Bank Officer Account"
          subtitle="Assign roles and retail banking underwriting department access"
          maxWidth="md"
        >
          <form onSubmit={handleCreateOfficer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Jonathan Burke"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="j.burke@smartlender.bank"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Security Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="loan_officer">Loan Officer</option>
                  <option value="loan_manager">Loan Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Retail Lending">Retail Lending</option>
                  <option value="Mortgage Origination">Mortgage Origination</option>
                  <option value="Underwriting & Risk Oversight">Risk Oversight</option>
                  <option value="Executive Credit Committee">Credit Committee</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm"
              >
                {actionLoading ? 'Provisioning...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
