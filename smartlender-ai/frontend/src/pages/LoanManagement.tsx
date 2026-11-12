import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BadgeDollarSign,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  Cpu,
  AlertTriangle,
  User,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Loan, LoanStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const LoanManagement: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Detail / Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [reviewStage, setReviewStage] = useState<string>('Risk Underwriting');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.loans.getAll({
        page,
        per_page: 8,
        status: statusFilter,
        search
      });
      if (res?.data) {
        setLoans(res.data);
        setTotalPages(res.pagination?.pages || 1);
        setTotalItems(res.pagination?.total || 0);

        // Check if query param asked for a specific loan modal
        const queryLoanId = searchParams.get('id');
        if (queryLoanId) {
          const match = res.data.find(l => l.id.toString() === queryLoanId);
          if (match) {
            handleOpenReview(match);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, statusFilter, search]);

  const handleOpenReview = (loan: Loan) => {
    setSelectedLoan(loan);
    setRemarks(loan.officer_remarks || '');
    setReviewStage(loan.review_stage || 'Risk Underwriting');
    setActionError(null);
    setReviewModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: LoanStatus) => {
    if (!selectedLoan) return;

    // RBAC check on client-side as well
    if (['Approved', 'Rejected'].includes(newStatus) && user?.role === 'loan_officer') {
      setActionError("Access Denied: Only Loan Managers and Administrators are authorized to formally Approve or Reject loans.");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await api.loans.update(selectedLoan.id, {
        status: newStatus,
        officer_remarks: remarks,
        review_stage: newStatus === 'Approved' ? 'Final Approval' : reviewStage
      });
      setReviewModalOpen(false);
      fetchLoans();
    } catch (err: any) {
      setActionError(err.message || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Rejected': return <Badge variant="danger">Rejected</Badge>;
      case 'Under Review': return <Badge variant="teal">Under Review</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  const isAuthorizedToDecide = user?.role === 'admin' || user?.role === 'loan_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BadgeDollarSign className="w-6 h-6 text-teal-700" />
            <span>Loan Application Management & Underwriting</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate incoming loan originations, track progress stages, and execute authorized credit decisions.
          </p>
        </div>
        <Link
          to="/new-application"
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 transition-all self-start sm:self-auto"
        >
          + Originate Application
        </Link>
      </div>

      {/* Filter and Status Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { label: 'All Applications', value: '' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Under Review', value: 'Under Review' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === tab.value
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by loan # or applicant name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Retrieving loan portfolios..." />
        ) : loans.length === 0 ? (
          <EmptyState
            title="No Loan Applications Found"
            description="No loan records match your selected status and filter parameters."
            actionText="Originate New Loan"
            onAction={() => window.location.href = '/new-application'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Application #</th>
                  <th className="py-3 px-5">Borrower Profile</th>
                  <th className="py-3 px-5">Loan Amount</th>
                  <th className="py-3 px-5">Facility & Term</th>
                  <th className="py-3 px-5">Review Stage</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {loan.application_number}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{loan.applicant?.full_name || 'Borrower'}</div>
                      <div className="text-[11px] text-slate-500">
                        {loan.applicant?.applicant_code} • {loan.applicant?.education}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      ${(loan.loan_amount * 1000).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-medium text-slate-800">{loan.loan_purpose}</span>
                      <div className="text-[11px] text-slate-500">{loan.loan_amount_term} Months</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {loan.review_stage || 'Initial Assessment'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/predict?applicant_id=${loan.applicant_id}&loan_id=${loan.id}`}
                          className="p-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                          title="Evaluate with AI Risk Model"
                        >
                          <Cpu className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenReview(loan)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={8}
        />
      </div>

      {/* Loan Underwriting Review Modal */}
      {reviewModalOpen && selectedLoan && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Underwriting Review: ${selectedLoan.application_number}`}
          subtitle={`Borrower: ${selectedLoan.applicant?.full_name} (${selectedLoan.applicant?.applicant_code})`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Requested Amount</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  ${(selectedLoan.loan_amount * 1000).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Term / Amortization</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedLoan.loan_amount_term} Mo
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Credit Status</span>
                <p className={`text-base font-extrabold mt-0.5 ${selectedLoan.applicant?.credit_history === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedLoan.applicant?.credit_history === 1 ? 'Criteria Met' : 'Past Defaults'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Current Status</span>
                <div className="mt-1">{getStatusBadge(selectedLoan.status)}</div>
              </div>
            </div>

            {/* Error banner if unauth or error */}
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* AI Shortcut Button */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-950">AI Underwriting Recommendation</h4>
                  <p className="text-[11px] text-teal-700">Calculate ML approval probability and risk factor breakdown for this borrower</p>
                </div>
              </div>
              <Link
                to={`/predict?applicant_id=${selectedLoan.applicant_id}&loan_id=${selectedLoan.id}`}
                className="px-3 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors whitespace-nowrap shadow-sm"
              >
                Run AI Scoring
              </Link>
            </div>

            {/* Review Stage Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Underwriting Review Stage</label>
                <select
                  value={reviewStage}
                  onChange={(e) => setReviewStage(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Initial Assessment">1. Initial Assessment</option>
                  <option value="Risk Underwriting">2. Risk Underwriting</option>
                  <option value="Escrow & Title Review">3. Escrow & Title Review</option>
                  <option value="Committee Deliberation">4. Committee Deliberation</option>
                  <option value="Final Approval">5. Final Approval</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Authorizing Officer</label>
                <input
                  type="text"
                  disabled
                  value={`${user?.full_name} (${user?.role})`}
                  className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Officer Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Committee Remarks & Audit Justification</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Document financial verification checks, rationale for decision, and terms conditions..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleUpdateStatus('Under Review')}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
              >
                Mark Under Review
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('Rejected')}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                    isAuthorizedToDecide
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-rose-100 text-rose-400 cursor-not-allowed'
                  }`}
                  title={!isAuthorizedToDecide ? 'Requires Manager or Admin role' : ''}
                >
                  <X className="w-4 h-4" />
                  <span>Reject Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('Approved')}
                  disabled={actionLoading}
                  className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 ${
                    isAuthorizedToDecide
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10'
                      : 'bg-emerald-100 text-emerald-400 cursor-not-allowed'
                  }`}
                  title={!isAuthorizedToDecide ? 'Requires Manager or Admin role' : ''}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Loan</span>
                </button>
              </div>
            </div>

            {!isAuthorizedToDecide && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg text-center border border-amber-200">
                Logged in as Loan Officer: You can update stage and remarks. Final Approval or Rejection requires Loan Manager or Administrator credentials.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
