import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  Cpu,
  Download,
  AlertCircle,
  Eye
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats, Loan } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.dashboard.getStats();
        if (res.data) {
          setStats(res.data);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load real-time dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Aggregating bank underwriting telemetry & ML stats..." />;
  }

  const summary = stats?.summary || {
    total_applications: 0,
    approved_loans: 0,
    rejected_loans: 0,
    pending_applications: 0,
    total_loan_amount_k: 0,
    total_loan_amount_dollars: 0,
    avg_loan_amount_k: 0,
    approval_rate: 0
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Rejected': return <Badge variant="danger">Rejected</Badge>;
      case 'Under Review': return <Badge variant="teal">Under Review</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome Action Suite */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#102A43] to-[#0A192F] rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" /> Live Portfolio Intelligence
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Institutional Underwriting Dashboard
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time loan origination metrics, credit risk distribution, and automated ML decision support telemetry.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/new-application"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-900/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Application</span>
          </Link>
          <Link
            to="/predict"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>Run AI Prediction</span>
          </Link>
          <a
            href={api.reports.getExportUrl('loans')}
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{error} Rendering cached metrics for inspection.</span>
        </div>
      )}

      {/* 6 Key Financial Metrics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Applications"
          value={summary.total_applications}
          icon={FileText}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-800"
          subtitle="All-time volume"
        />
        <StatCard
          title="Approved Loans"
          value={summary.approved_loans}
          icon={CheckCircle}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          change={`${summary.approval_rate}%`}
          subtitle="Approval rate"
        />
        <StatCard
          title="Rejected Loans"
          value={summary.rejected_loans}
          icon={XCircle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          change={`${(100 - summary.approval_rate).toFixed(1)}%`}
          isPositive={false}
          subtitle="Risk decline rate"
        />
        <StatCard
          title="Pending Review"
          value={summary.pending_applications}
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          subtitle="Awaiting committee"
        />
        <StatCard
          title="Requested Volume"
          value={`$${(summary.total_loan_amount_dollars / 1000000).toFixed(2)}M`}
          icon={DollarSign}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          subtitle={`Avg: $${summary.avg_loan_amount_k}K/loan`}
        />
        <StatCard
          title="Approval Rate"
          value={`${summary.approval_rate}%`}
          icon={TrendingUp}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-600"
          subtitle="Credit committee benchmark"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Loan Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of current application pipeline</p>
            </div>
          </div>
          <div className="h-64 flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(stats?.status_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Applications`, 'Count']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Applications Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Application Volume</h3>
              <p className="text-xs text-slate-500">Applications submitted over last 6 months</p>
            </div>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthly_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total" name="Applications" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval vs Rejection Trends Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Approval vs Rejection Trend</h3>
              <p className="text-xs text-slate-500">Underwriting decisions across months</p>
            </div>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthly_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Line type="monotone" dataKey="approved" name="Approved" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Loan Applications</h3>
            <p className="text-xs text-slate-500">Latest originations pending review and action</p>
          </div>
          <Link
            to="/loans"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
          >
            <span>View All Loans</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Application ID</th>
                <th className="py-3 px-6">Applicant Name</th>
                <th className="py-3 px-6">Loan Amount</th>
                <th className="py-3 px-6">Purpose</th>
                <th className="py-3 px-6">Credit Bureau</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {(stats?.recent_applications || []).slice(0, 6).map((loan: Loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                    {loan.application_number}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-800">
                    {loan.applicant?.full_name || 'N/A'}
                  </td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    ${(loan.loan_amount * 1000).toLocaleString()}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">({loan.loan_amount_term} mo)</span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    {loan.loan_purpose}
                  </td>
                  <td className="py-3.5 px-6">
                    {loan.applicant?.credit_history === 1 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Criteria Met
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                        <XCircle className="w-3 h-3 text-rose-600" /> Past Default
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    {getStatusBadge(loan.status)}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Link
                      to={`/loans?id=${loan.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
