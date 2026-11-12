import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  CheckCircle2,
  User,
  Briefcase,
  DollarSign,
  Building,
  Save,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Calculator,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { Applicant } from '../types';

export const NewApplication: React.FC = () => {
  const navigate = useNavigate();

  const [existingApplicants, setExistingApplicants] = useState<Applicant[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>('new');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Personal
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: 'Male',
    married: 'No',
    dependents: '0',
    // Employment & Income
    education: 'Graduate',
    self_employed: 'No',
    applicant_income: 6500,
    coapplicant_income: 1500,
    // Financial & Credit
    credit_history: 1,
    // Loan specifics
    loan_amount: 180, // in $K
    loan_amount_term: 360, // in months
    loan_purpose: 'Home Purchase',
    // Property
    property_area: 'Semiurban',
    address: '',
    officer_remarks: 'Application submitted for underwriting.'
  });

  // Load existing applicants
  useEffect(() => {
    const loadApplicants = async () => {
      try {
        const res = await api.applicants.getAll({ per_page: 50 });
        if (res?.data) {
          setExistingApplicants(res.data);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadApplicants();
  }, []);

  // When selecting existing applicant, populate form fields
  const handleApplicantSelect = (val: string) => {
    setSelectedApplicantId(val);
    if (val !== 'new') {
      const app = existingApplicants.find(a => a.id.toString() === val);
      if (app) {
        setFormData(prev => ({
          ...prev,
          first_name: app.first_name,
          last_name: app.last_name,
          email: app.email,
          phone: app.phone,
          gender: app.gender,
          married: app.married,
          dependents: app.dependents,
          education: app.education,
          self_employed: app.self_employed,
          applicant_income: app.applicant_income,
          coapplicant_income: app.coapplicant_income,
          credit_history: app.credit_history,
          property_area: app.property_area,
          address: app.address || ''
        }));
      }
    }
  };

  // Calculations for underwriting preview
  const totalIncome = (Number(formData.applicant_income) || 0) + (Number(formData.coapplicant_income) || 0);
  const monthlyEmi = ((Number(formData.loan_amount) || 0) * 1000) / (Number(formData.loan_amount_term) || 360);
  const dtiRatio = totalIncome > 0 ? (monthlyEmi / totalIncome) * 100 : 0;

  const handleSaveDraft = () => {
    localStorage.setItem('smartlender_loan_draft', JSON.stringify(formData));
    alert('Loan application successfully saved to local draft storage.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        loan_amount: Number(formData.loan_amount),
        loan_amount_term: Number(formData.loan_amount_term),
        loan_purpose: formData.loan_purpose,
        officer_remarks: formData.officer_remarks,
        status: 'Pending'
      };

      if (selectedApplicantId !== 'new') {
        payload.applicant_id = Number(selectedApplicantId);
      } else {
        payload.first_name = formData.first_name;
        payload.last_name = formData.last_name;
        payload.email = formData.email;
        payload.phone = formData.phone;
        payload.gender = formData.gender;
        payload.married = formData.married;
        payload.dependents = formData.dependents;
        payload.education = formData.education;
        payload.self_employed = formData.self_employed;
        payload.applicant_income = Number(formData.applicant_income);
        payload.coapplicant_income = Number(formData.coapplicant_income);
        payload.credit_history = Number(formData.credit_history);
        payload.property_area = formData.property_area;
        payload.address = formData.address;
      }

      const res = await api.loans.create(payload);
      if (res.data) {
        setSuccessMessage(`Loan Application ${res.data.application_number} submitted successfully!`);
        setTimeout(() => {
          navigate('/loans');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit loan application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Personal Information', icon: User },
    { num: 2, title: 'Employment & Financials', icon: Briefcase },
    { num: 3, title: 'Loan & Collateral', icon: DollarSign }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FilePlus2 className="w-6 h-6 text-teal-700" />
            <span>Originate New Loan Application</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest borrower details, loan specifics, property collateral, and credit bureau figures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Select Existing Applicant Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs">
          <span className="font-bold text-slate-800">Borrower Record Selection:</span>
          <p className="text-slate-500">Attach to an existing registered profile or create a new applicant</p>
        </div>
        <select
          value={selectedApplicantId}
          onChange={(e) => handleApplicantSelect(e.target.value)}
          className="w-full sm:w-72 p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none font-medium"
        >
          <option value="new">+ Register New Applicant Profile</option>
          {existingApplicants.map((a) => (
            <option key={a.id} value={a.id}>
              {a.applicant_code} – {a.first_name} {a.last_name} (${a.applicant_income}/mo)
            </option>
          ))}
        </select>
      </div>

      {/* Multi-step progress tabs */}
      <div className="grid grid-cols-3 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.num;
          const isPassed = activeStep > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                isActive
                  ? 'bg-teal-50 border-teal-500/80 text-teal-900 shadow-sm'
                  : isPassed
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-slate-50 border-slate-200/60 text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : isPassed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <div className="truncate hidden sm:block">
                <span className="text-xs font-bold block leading-none">{s.title}</span>
                <span className="text-[10px] text-slate-400 font-medium">Step {s.num}</span>
              </div>
            </button>
          );
        })}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Step 1: Personal Details */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" />
              <span>Section 1: Borrower Demographic Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. Alexander"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. Wright"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="a.wright@enterprise.com"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 234-5678"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marital Status</label>
                <select
                  value={formData.married}
                  onChange={(e) => setFormData({ ...formData, married: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="No">No (Single)</option>
                  <option value="Yes">Yes (Married)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dependents</label>
                <select
                  value={formData.dependents}
                  onChange={(e) => setFormData({ ...formData, dependents: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="0">0 Dependents</option>
                  <option value="1">1 Dependent</option>
                  <option value="2">2 Dependents</option>
                  <option value="3+">3+ Dependents</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <span>Continue to Financials</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Employment & Financial Information */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-700" />
              <span>Section 2: Employment, Cash Flow & Credit Criteria</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                <select
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Graduate">Graduate</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Self Employed / Business Owner</label>
                <select
                  value={formData.self_employed}
                  onChange={(e) => setFormData({ ...formData, self_employed: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="No">No (Salaried Employee)</option>
                  <option value="Yes">Yes (Self-Employed Professional / Entrepreneur)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Monthly Applicant Income ($) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  value={formData.applicant_income}
                  onChange={(e) => setFormData({ ...formData, applicant_income: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Monthly Co-Applicant Income ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.coapplicant_income}
                  onChange={(e) => setFormData({ ...formData, coapplicant_income: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit History Compliance (Equifax/Experian)</label>
              <select
                value={formData.credit_history}
                onChange={(e) => setFormData({ ...formData, credit_history: parseInt(e.target.value) })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-semibold text-slate-800"
              >
                <option value="1">1.0 – Satisfies Credit Bureau Criteria (Clean payment history)</option>
                <option value="0">0.0 – Deficient / Prior Recorded Defaults / Low Score</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                * Note: In automated ML underwriting, credit history criteria is the single most decisive approval gating variable.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <span>Continue to Loan Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Loan Details, Collateral & Underwriting Preview */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-700" />
              <span>Section 3: Loan Facility, Collateral & Financial Stress Testing</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Amount Requested ($K) *</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="1000"
                  value={formData.loan_amount}
                  onChange={(e) => setFormData({ ...formData, loan_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  = ${(Number(formData.loan_amount) * 1000).toLocaleString()} USD
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Term (Months) *</label>
                <select
                  value={formData.loan_amount_term}
                  onChange={(e) => setFormData({ ...formData, loan_amount_term: parseInt(e.target.value) })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="120">120 Months (10 Years)</option>
                  <option value="180">180 Months (15 Years)</option>
                  <option value="240">240 Months (20 Years)</option>
                  <option value="300">300 Months (25 Years)</option>
                  <option value="360">360 Months (30 Years Standard)</option>
                  <option value="480">480 Months (40 Years)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Purpose</label>
                <select
                  value={formData.loan_purpose}
                  onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Home Purchase">Home Purchase / Mortgage</option>
                  <option value="Commercial Property">Commercial Property</option>
                  <option value="Home Improvement">Home Improvement</option>
                  <option value="Debt Consolidation">Debt Consolidation</option>
                  <option value="Business Expansion">Business Expansion</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Property Locality / Area</label>
                <select
                  value={formData.property_area}
                  onChange={(e) => setFormData({ ...formData, property_area: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Semiurban">Semiurban (Highest historical approval tier)</option>
                  <option value="Urban">Urban (High liquidity prime metro)</option>
                  <option value="Rural">Rural (Agricultural / Regional)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Collateral / Security Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, State or Lot number"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Origination Remarks / Officer Notes</label>
              <textarea
                rows={2}
                value={formData.officer_remarks}
                onChange={(e) => setFormData({ ...formData, officer_remarks: e.target.value })}
                placeholder="Initial underwriting observations, verification trail, etc."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            {/* Live Financial Stress Test Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Calculator className="w-4 h-4 text-teal-600" />
                <span>Underwriting Preliminary Stress Test Indicator</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Monthly EMI</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    ${monthlyEmi.toFixed(0)}/mo
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Debt-to-Income (DTI)</span>
                  <p className={`text-sm font-extrabold mt-0.5 ${dtiRatio < 35 ? 'text-emerald-600' : dtiRatio < 45 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {dtiRatio.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Credit Gating Rule</span>
                  <p className={`text-sm font-extrabold mt-0.5 ${formData.credit_history === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formData.credit_history === 1 ? 'Compliant' : 'High Risk'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-900/10 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting to Loan Board...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Formal Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
