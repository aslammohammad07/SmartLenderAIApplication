import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Cpu,
  Calendar,
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Prediction } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { FactorBreakdown } from '../components/ai/FactorBreakdown';

export const PredictionHistory: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const res = await api.predictions.getAll({
        page,
        per_page: 8,
        search,
        risk_level: riskFilter,
        prediction_label: labelFilter
      });
      if (res?.data) {
        setPredictions(res.data);
        setTotalPages(res.pagination?.pages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [page, search, riskFilter, labelFilter]);

  const handleOpenDetail = (pred: Prediction) => {
    setSelectedPrediction(pred);
    setDetailModalOpen(true);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Low': return <Badge variant="success">Low Risk</Badge>;
      case 'Moderate': return <Badge variant="info">Moderate Risk</Badge>;
      case 'High': return <Badge variant="warning">High Risk</Badge>;
      case 'Severe': return <Badge variant="danger">Severe Risk</Badge>;
      default: return <Badge variant="neutral">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-teal-700" />
            <span>Machine Learning Underwriting Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived probabilistic determinations, confidence metrics, and algorithm feature attribution.
          </p>
        </div>
        <a
          href={api.reports.getExportUrl('predictions')}
          download
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Prediction Log</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by applicant code or borrower name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 outline-none text-slate-700"
          >
            <option value="">All Risk Tiers</option>
            <option value="Low">Low Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="High">High Risk</option>
            <option value="Severe">Severe Risk</option>
          </select>

          {/* Prediction Label Filter */}
          <select
            value={labelFilter}
            onChange={(e) => {
              setLabelFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 outline-none text-slate-700"
          >
            <option value="">All ML Outcomes</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Querying inference history..." />
        ) : predictions.length === 0 ? (
          <EmptyState
            title="No Prediction Records Found"
            description="No machine learning underwriting evaluations match the query filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Inference ID</th>
                  <th className="py-3 px-5">Borrower Profile</th>
                  <th className="py-3 px-5">ML Prediction</th>
                  <th className="py-3 px-5">Confidence Score</th>
                  <th className="py-3 px-5">Assigned Risk</th>
                  <th className="py-3 px-5">Model Version</th>
                  <th className="py-3 px-5">Evaluated At</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      PRED-{p.id.toString().padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{p.applicant_name}</div>
                      <div className="text-[11px] text-slate-500">{p.applicant_code}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      {p.prediction_label === 'Approved' ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                          <CheckCircle className="w-4 h-4 text-emerald-600" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-bold text-rose-700">
                          <XCircle className="w-4 h-4 text-rose-600" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${p.prediction_label === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${p.confidence_percent}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800">{p.confidence_percent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {getRiskBadge(p.risk_level)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                      {p.model_version}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        title="View Full Attribution"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Detail Modal */}
      {detailModalOpen && selectedPrediction && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Inference Attribution: PRED-${selectedPrediction.id.toString().padStart(4, '0')}`}
          subtitle={`Applicant: ${selectedPrediction.applicant_name} (${selectedPrediction.applicant_code})`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Result</span>
                <p className={`text-base font-extrabold mt-0.5 ${selectedPrediction.prediction_label === 'Approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedPrediction.prediction_label}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Confidence</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">
                  {selectedPrediction.confidence_percent}%
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Risk Tier</span>
                <div className="mt-1">{getRiskBadge(selectedPrediction.risk_level)}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Feature Weight Breakdown</h4>
              <FactorBreakdown factors={selectedPrediction.contributing_factors} />
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
              <span>Model: {selectedPrediction.model_version}</span>
              <span>Final Decision: {selectedPrediction.final_decision}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
