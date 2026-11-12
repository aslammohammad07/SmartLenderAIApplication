import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  GraduationCap,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { Applicant } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';

export const Applicants: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [educationFilter, setEducationFilter] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [creditFilter, setCreditFilter] = useState<string>('');

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Modals state
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Applicant>>({});

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [applicantToDelete, setApplicantToDelete] = useState<Applicant | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await api.applicants.getAll({
        page,
        per_page: 8,
        search,
        gender: genderFilter,
        education: educationFilter,
        property_area: propertyFilter,
        credit_history: creditFilter
      });
      if (res?.data) {
        setApplicants(res.data);
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
    fetchApplicants();
  }, [page, search, genderFilter, educationFilter, propertyFilter, creditFilter]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: 'Male',
      married: 'No',
      dependents: '0',
      education: 'Graduate',
      self_employed: 'No',
      applicant_income: 6000,
      coapplicant_income: 0,
      credit_history: 1,
      property_area: 'Urban',
      address: ''
    });
    setFormModalOpen(true);
  };

  const handleOpenEdit = (applicant: Applicant) => {
    setIsEditing(true);
    setSelectedApplicant(applicant);
    setFormData({ ...applicant });
    setFormModalOpen(true);
  };

  const handleOpenView = async (applicant: Applicant) => {
    try {
      const res = await api.applicants.getById(applicant.id);
      setSelectedApplicant(res.data || applicant);
    } catch {
      setSelectedApplicant(applicant);
    }
    setViewModalOpen(true);
  };

  const handleSaveApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isEditing && selectedApplicant) {
        await api.applicants.update(selectedApplicant.id, formData);
      } else {
        await api.applicants.create(formData);
      }
      setFormModalOpen(false);
      fetchApplicants();
    } catch (err: any) {
      alert(`Operation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteApplicant = async () => {
    if (!applicantToDelete) return;
    setActionLoading(true);
    try {
      await api.applicants.delete(applicantToDelete.id);
      setDeleteModalOpen(false);
      setApplicantToDelete(null);
      fetchApplicants();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-700" />
            <span>Applicant Profiles Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage prospective borrowers, demographic attributes, credit scores, and financial history.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Applicant</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, applicant code, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
            />
          </div>

          {/* Education Filter */}
          <select
            value={educationFilter}
            onChange={(e) => {
              setEducationFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 outline-none text-slate-700"
          >
            <option value="">All Education Levels</option>
            <option value="Graduate">Graduate</option>
            <option value="Not Graduate">Not Graduate</option>
          </select>

          {/* Property Area Filter */}
          <select
            value={propertyFilter}
            onChange={(e) => {
              setPropertyFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 outline-none text-slate-700"
          >
            <option value="">All Property Areas</option>
            <option value="Urban">Urban</option>
            <option value="Semiurban">Semiurban</option>
            <option value="Rural">Rural</option>
          </select>

          {/* Credit History Filter */}
          <select
            value={creditFilter}
            onChange={(e) => {
              setCreditFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 outline-none text-slate-700"
          >
            <option value="">All Credit Profiles</option>
            <option value="1">Criteria Met (CH=1)</option>
            <option value="0">Delinquent / None (CH=0)</option>
          </select>
        </div>
      </div>

      {/* Applicants Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Retrieving applicant demographic repository..." />
        ) : applicants.length === 0 ? (
          <EmptyState
            title="No Applicants Found"
            description="No applicant records match your filter criteria. Try adjusting or clearing search terms."
            actionText="Add New Applicant"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Applicant Code</th>
                  <th className="py-3 px-5">Name & Contact</th>
                  <th className="py-3 px-5">Demographics</th>
                  <th className="py-3 px-5">Monthly Income</th>
                  <th className="py-3 px-5">Property Area</th>
                  <th className="py-3 px-5">Credit Bureau</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {applicants.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                      {a.applicant_code}
                    </td>
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-900">{a.first_name} {a.last_name}</div>
                      <div className="text-[11px] text-slate-500">{a.email}</div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-slate-800 font-medium">{a.gender}, {a.married === 'Yes' ? 'Married' : 'Single'}</span>
                      <div className="text-[11px] text-slate-500">{a.education} • Dep: {a.dependents}</div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900">
                        ${a.applicant_income?.toLocaleString()}/mo
                      </div>
                      {a.coapplicant_income > 0 && (
                        <div className="text-[11px] text-teal-600 font-medium">
                          +${a.coapplicant_income?.toLocaleString()} co-app
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant={a.property_area === 'Semiurban' ? 'teal' : a.property_area === 'Urban' ? 'info' : 'neutral'}>
                        {a.property_area}
                      </Badge>
                    </td>
                    <td className="py-3 px-5">
                      {a.credit_history === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Criteria Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Past Default
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(a)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setApplicantToDelete(a);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* View Applicant Detail Profile Modal */}
      {viewModalOpen && selectedApplicant && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Applicant Profile: ${selectedApplicant.first_name} ${selectedApplicant.last_name}`}
          subtitle={`Internal Banking Code: ${selectedApplicant.applicant_code}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Quick Summary Pill Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Credit Criteria</p>
                <p className={`text-sm font-bold mt-0.5 ${selectedApplicant.credit_history === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedApplicant.credit_history === 1 ? 'Pass (1.0)' : 'Fail (0.0)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Gross Income</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  ${selectedApplicant.applicant_income?.toLocaleString()}/mo
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Co-Applicant</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  ${selectedApplicant.coapplicant_income?.toLocaleString()}/mo
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Property Area</p>
                <p className="text-sm font-bold text-teal-700 mt-0.5">
                  {selectedApplicant.property_area}
                </p>
              </div>
            </div>

            {/* Detailed Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-4 rounded-xl border border-slate-100 bg-white">
                <span className="font-bold text-slate-900 text-xs block mb-2">Demographic Specifications</span>
                <p><strong className="text-slate-500">Gender:</strong> {selectedApplicant.gender}</p>
                <p><strong className="text-slate-500">Marital Status:</strong> {selectedApplicant.married === 'Yes' ? 'Married' : 'Unmarried'}</p>
                <p><strong className="text-slate-500">Dependents:</strong> {selectedApplicant.dependents}</p>
                <p><strong className="text-slate-500">Education:</strong> {selectedApplicant.education}</p>
              </div>
              <div className="space-y-2 p-4 rounded-xl border border-slate-100 bg-white">
                <span className="font-bold text-slate-900 text-xs block mb-2">Employment & Contact</span>
                <p><strong className="text-slate-500">Self Employed:</strong> {selectedApplicant.self_employed}</p>
                <p><strong className="text-slate-500">Email:</strong> {selectedApplicant.email}</p>
                <p><strong className="text-slate-500">Phone:</strong> {selectedApplicant.phone}</p>
                <p><strong className="text-slate-500">Address:</strong> {selectedApplicant.address || 'Standard Registered Residence'}</p>
              </div>
            </div>

            {/* Related Applications History */}
            {selectedApplicant.loans && selectedApplicant.loans.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Associated Loan Applications</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedApplicant.loans.map((l) => (
                    <div key={l.id} className="p-3 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900 mr-2">{l.application_number}</span>
                        <span className="text-slate-500">{l.loan_purpose} (${l.loan_amount}K)</span>
                      </div>
                      <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}>
                        {l.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add / Edit Form Modal */}
      {formModalOpen && (
        <Modal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          title={isEditing ? "Edit Applicant Profile" : "Register New Loan Applicant"}
          subtitle="Ensure demographic and financial figures match authenticated tax or bureau documents"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveApplicant} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender || 'Male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marital Status</label>
                <select
                  value={formData.married || 'No'}
                  onChange={(e) => setFormData({ ...formData, married: e.target.value as any })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="No">No (Single)</option>
                  <option value="Yes">Yes (Married)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dependents</label>
                <select
                  value={formData.dependents || '0'}
                  onChange={(e) => setFormData({ ...formData, dependents: e.target.value as any })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                <select
                  value={formData.education || 'Graduate'}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value as any })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Graduate">Graduate</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Self Employed</label>
                <select
                  value={formData.self_employed || 'No'}
                  onChange={(e) => setFormData({ ...formData, self_employed: e.target.value as any })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="No">No (Salaried Employee)</option>
                  <option value="Yes">Yes (Self-Employed / Business)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Applicant Income ($)</label>
                <input
                  type="number"
                  required
                  min="500"
                  value={formData.applicant_income || ''}
                  onChange={(e) => setFormData({ ...formData, applicant_income: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Co-Applicant Income ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.coapplicant_income || 0}
                  onChange={(e) => setFormData({ ...formData, coapplicant_income: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Property Area</label>
                <select
                  value={formData.property_area || 'Urban'}
                  onChange={(e) => setFormData({ ...formData, property_area: e.target.value as any })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Urban">Urban</option>
                  <option value="Semiurban">Semiurban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Bureau History Criteria</label>
                <select
                  value={formData.credit_history !== undefined ? formData.credit_history : 1}
                  onChange={(e) => setFormData({ ...formData, credit_history: parseInt(e.target.value) })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="1">Pass / Meets Guidelines (1.0)</option>
                  <option value="0">Fail / History of Defaults (0.0)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, city, state, zip"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition-all"
              >
                {actionLoading ? 'Saving...' : isEditing ? 'Update Applicant Profile' : 'Save Applicant Profile'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && applicantToDelete && (
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteApplicant}
          title="Delete Applicant Record"
          message={`Are you sure you want to permanently delete profile for ${applicantToDelete.first_name} ${applicantToDelete.last_name} (${applicantToDelete.applicant_code})? Any associated active loan applications will also be purged.`}
          confirmText="Yes, Delete Record"
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
