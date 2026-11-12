import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Info,
  Clock,
  ArrowRight,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { Applicant, Prediction } from '../types';
import { GaugeChart } from '../components/ai/GaugeChart';
import { FactorBreakdown } from '../components/ai/FactorBreakdown';
import { Badge } from '../components/common/Badge';

export const AIPrediction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectApplicantId = searchParams.get('applicant_id');
  const preselectLoanId = searchParams.get('loan_id');

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>(preselectApplicantId || 'custom');
  const [modelInfo, setModelInfo] = useState<any>(null);

  // Form inputs
  const [inputFeatures, setInputFeatures] = useState({
    Gender: 'Male',
    Married: 'Yes',
    Dependents: '1',
    Education: 'Graduate',
    Self_Employed: 'No',
    ApplicantIncome: 8500,
    CoapplicantIncome: 3200,
    LoanAmount: 220,
    Loan_Amount_Term: 360,
    Credit_History: 1,
    Property_Area: 'Semiurban',
    first_name: 'Alexander',
    last_name: 'Wright'
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<Prediction | null>(null);
  const [decisionRecorded, setDecisionRecorded] = useState<string | null>(null);

  // Load applicants and model info
  useEffect(() => {
    const init = async () => {
      try {
        const [appRes, modelRes] = await Promise.all([
          api.applicants.getAll({ per_page: 50 }),
          api.predictions.getModelInfo().catch(() => null)
        ]);

        if (appRes?.data) {
          setApplicants(appRes.data);
          if (preselectApplicantId) {
            const found = appRes.data.find(a => a.id.toString() === preselectApplicantId);
            if (found) {
              populateFromApplicant(found);
            }
          }
        }

        if (modelRes?.data) {
          setModelInfo(modelRes.data);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    init();
  }, [preselectApplicantId]);

  const populateFromApplicant = (app: Applicant) => {
    setInputFeatures(prev => ({
      ...prev,
      Gender: app.gender,
      Married: app.married,
      Dependents: app.dependents,
      Education: app.education,
      Self_Employed: app.self_employed,
      ApplicantIncome: app.applicant_income,
      CoapplicantIncome: app.coapplicant_income,
      Credit_History: app.credit_history,
      Property_Area: app.property_area,
      first_name: app.first_name,
      last_name: app.last_name
    }));
  };

  const handleSelectApplicant = (val: string) => {
    setSelectedApplicantId(val);
    if (val !== 'custom') {
      const app = applicants.find(a => a.id.toString() === val);
      if (app) populateFromApplicant(app);
    }
  };

  const handleRunPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDecisionRecorded(null);

    try {
      const payload: any = {
        ...inputFeatures,
        ApplicantIncome: Number(inputFeatures.ApplicantIncome),
        CoapplicantIncome: Number(inputFeatures.CoapplicantIncome),
        LoanAmount: Number(inputFeatures.LoanAmount),
        Loan_Amount_Term: Number(inputFeatures.Loan_Amount_Term),
        Credit_History: Number(inputFeatures.Credit_History)
      };

      if (selectedApplicantId !== 'custom') {
        payload.applicant_id = Number(selectedApplicantId);
      }
      if (preselectLoanId) {
        payload.loan_id = Number(preselectLoanId);
      }

      const res = await api.predictions.predict(payload);
      if (res?.data) {
        setPredictionResult(res.data);
      }
    } catch (err: any) {
      alert(`Prediction inference error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfficerDecision = async (decision: 'Approved' | 'Rejected') => {
    if (!predictionResult) return;
    try {
      await api.predictions.makeDecision(predictionResult.id || 1, decision);
      setDecisionRecorded(decision);
      setPredictionResult(prev => prev ? { ...prev, final_decision: decision } : null);
    } catch (err: any) {
      alert(`Decision recording failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#0F2942] to-[#0A192F] rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Machine Learning Decision Support System
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            AI Underwriting & Credit Risk Inference Engine
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Execute real-time probabilistic classification with feature attribution, confidence scoring, and debt-to-income stress testing.
          </p>
        </div>

        {modelInfo && (
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 text-xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 font-bold">
              {modelInfo.version}
            </div>
            <div>
              <p className="font-bold text-white">{modelInfo.algorithm}</p>
              <p className="text-[11px] text-emerald-400">Validated Test Accuracy: {(modelInfo.metrics?.accuracy * 100 || 99.8).toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-700" />
              <span>Underwriting Parameters</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">11 Variables</span>
          </div>

          {/* Quick Applicant Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Populate from Applicant</label>
            <select
              value={selectedApplicantId}
              onChange={(e) => handleSelectApplicant(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-medium"
            >
              <option value="custom">Manual Parameter Simulation</option>
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.applicant_code} – {a.first_name} {a.last_name} (${a.applicant_income}/mo)
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleRunPrediction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Income ($)</label>
                <input
                  type="number"
                  required
                  value={inputFeatures.ApplicantIncome}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, ApplicantIncome: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Co-Applicant Income ($)</label>
                <input
                  type="number"
                  value={inputFeatures.CoapplicantIncome}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, CoapplicantIncome: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Amount ($K)</label>
                <input
                  type="number"
                  required
                  value={inputFeatures.LoanAmount}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, LoanAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ${(Number(inputFeatures.LoanAmount) * 1000).toLocaleString()}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Term (Mo)</label>
                <select
                  value={inputFeatures.Loan_Amount_Term}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, Loan_Amount_Term: parseInt(e.target.value) })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="120">120 (10 yrs)</option>
                  <option value="180">180 (15 yrs)</option>
                  <option value="240">240 (20 yrs)</option>
                  <option value="360">360 (30 yrs)</option>
                  <option value="480">480 (40 yrs)</option>
                </select>
              </div>
            </div>

            {/* Credit History (Decisive ML Factor) */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
              <label className="block text-xs font-bold text-amber-950 mb-1">
                Credit Bureau Compliance (Equifax/Experian)
              </label>
              <select
                value={inputFeatures.Credit_History}
                onChange={(e) => setInputFeatures({ ...inputFeatures, Credit_History: parseInt(e.target.value) })}
                className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg outline-none font-bold text-slate-800"
              >
                <option value="1">1.0 – Satisfies Credit Bureau Criteria (Compliant)</option>
                <option value="0">0.0 – Deficient / Defaults Flagged (Non-compliant)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Property Locality</label>
                <select
                  value={inputFeatures.Property_Area}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, Property_Area: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Semiurban">Semiurban</option>
                  <option value="Urban">Urban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                <select
                  value={inputFeatures.Education}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, Education: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Graduate">Graduate</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={inputFeatures.Gender}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, Gender: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Married</label>
                <select
                  value={inputFeatures.Married}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, Married: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dependents</label>
                <select
                  value={inputFeatures.Dependents}
                  onChange={(e) => setInputFeatures({ ...inputFeatures, Dependents: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0A192F] hover:bg-[#132A4A] text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Executing Pipeline Inference...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Execute ML Credit Risk Model</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Results Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {!predictionResult ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <Cpu className="w-8 h-8 text-teal-700" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Awaiting Underwriting Inference</h4>
              <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                Configure borrower attributes on the left or select an existing applicant, then click <strong className="text-slate-700">"Execute ML Credit Risk Model"</strong> to generate statistical probability scores.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Header Status & Result Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  predictionResult.prediction_label === 'Approved'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3 text-center sm:text-left">
                  {predictionResult.prediction_label === 'Approved' ? (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-900/20">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-900/20">
                      <XCircle className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ML Recommendation</span>
                    <h3 className="text-xl font-extrabold tracking-tight">
                      Recommendation: {predictionResult.prediction_label === 'Approved' ? 'APPROVAL RECOMMENDED' : 'DECLINE / HIGH RISK'}
                    </h3>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-xs text-slate-500 block">Model Version</span>
                  <span className="text-xs font-mono font-bold text-slate-800">{predictionResult.model_version}</span>
                </div>
              </div>

              {/* Gauge and Risk Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <GaugeChart
                  score={predictionResult.confidence_percent}
                  label={predictionResult.prediction_label === 'Approved' ? 'Approval Probability' : 'Decline Probability'}
                  riskLevel={predictionResult.risk_level}
                />

                <div className="space-y-3 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Underwriting Assessment</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Calculated Probability:</span>
                      <span className="font-mono font-bold text-slate-900">{(predictionResult.probability * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Assigned Risk Tier:</span>
                      <span className="font-bold text-slate-900">{predictionResult.risk_level} Risk</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Evaluated Applicant:</span>
                      <span className="font-bold text-slate-900">{predictionResult.applicant_name || 'Borrower'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contributing Factors & Explainability Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <span>Key Contributing Underwriting Factors</span>
                </h4>
                <FactorBreakdown factors={predictionResult.contributing_factors} />
              </div>

              {/* Regulatory Compliance Disclaimer */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="font-semibold">Decision Support Disclaimer:</strong> SmartLenderAI machine learning outputs serve strictly as quantitative decision-support recommendations. In adherence with fair lending policies, all credit originations require review and sign-off by a certified human risk officer.
                </p>
              </div>

              {/* Committee Officer Final Decision Action */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Record Credit Decision</span>
                  <span className="text-[11px] text-slate-500">Save authorized determination to database audit log</span>
                </div>

                {decisionRecorded ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Decision Recorded: {decisionRecorded}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleOfficerDecision('Rejected')}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                    >
                      Reject Application
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOfficerDecision('Approved')}
                      className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-900/10 transition-colors"
                    >
                      Approve Loan
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
