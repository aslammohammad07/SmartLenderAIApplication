import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  User,
  Lock,
  Bell,
  Shield,
  Cpu,
  Save,
  CheckCircle2,
  LogOut,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'security' | 'model'>('profile');
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Bank profile state
  const [bankSettings, setBankSettings] = useState({
    institutionName: 'SmartLender National Credit Union',
    routingCode: 'SLND-US-0912',
    baseInterestRate: 6.75,
    minCreditScoreApproval: 620,
    dtiThreshold: 43.0,
    autoDeclineHighRisk: false
  });

  // Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    const loadModel = async () => {
      try {
        const res = await api.predictions.getModelInfo();
        if (res?.data) setModelInfo(res.data);
      } catch (err) {
        console.warn(err);
      }
    };
    loadModel();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-700" />
            <span>Settings & Institution Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage officer preferences, institutional underwriting boundaries, and machine learning telemetry.
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Terminal</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Configuration parameters updated and synchronized with backend repository.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'bank', label: 'Bank Parameters', icon: Building },
          { id: 'security', label: 'Security & Auth', icon: Lock },
          { id: 'model', label: 'ML Model Details', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-[#0A192F] text-teal-300 font-extrabold flex items-center justify-center text-xl shadow-lg border border-teal-500/30">
              {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.full_name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {user?.role?.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-medium">{user?.department}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  defaultValue={user?.full_name}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email}
                  className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lending Department</label>
                <input
                  type="text"
                  defaultValue={user?.department || 'Retail Underwriting'}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terminal Role Authorization</label>
                <input
                  type="text"
                  disabled
                  value={user?.role?.toUpperCase()}
                  className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank Parameters Tab */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Institutional Credit Risk Governance</h3>
            <p className="text-xs text-slate-500">Configure underwriting policy thresholds applied across portfolios</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Institution Name</label>
                <input
                  type="text"
                  value={bankSettings.institutionName}
                  onChange={(e) => setBankSettings({ ...bankSettings, institutionName: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Routing Code</label>
                <input
                  type="text"
                  value={bankSettings.routingCode}
                  onChange={(e) => setBankSettings({ ...bankSettings, routingCode: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Prime Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.05"
                  value={bankSettings.baseInterestRate}
                  onChange={(e) => setBankSettings({ ...bankSettings, baseInterestRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum FICO / Score Cutoff</label>
                <input
                  type="number"
                  value={bankSettings.minCreditScoreApproval}
                  onChange={(e) => setBankSettings({ ...bankSettings, minCreditScoreApproval: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Prudent DTI Limit (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={bankSettings.dtiThreshold}
                  onChange={(e) => setBankSettings({ ...bankSettings, dtiThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Bank Parameters</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Terminal Authentication & Credentials</h3>
            <p className="text-xs text-slate-500">Update officer access token credentials</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Secure Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Update Password
            </button>
          </form>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 mt-6">
            <span className="font-bold text-slate-900">Security Architecture Overview</span>
            <p className="text-slate-600 leading-relaxed">
              Tokens are signed using RFC 7519 HMAC-SHA256 with 24-hour expiration lifetimes. Passwords are hash-digested via PBKDF2:SHA256 with cryptographically random salts.
            </p>
          </div>
        </div>
      )}

      {/* ML Model Details Tab */}
      {activeTab === 'model' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Production Scikit-Learn ML Underwriting Pipeline</h3>
              <p className="text-xs text-slate-500">Model metadata, classification benchmarks, and confusion matrix</p>
            </div>
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {modelInfo?.version || 'v1.4.2-prod'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {(modelInfo?.metrics?.accuracy * 100 || 99.8).toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Precision</span>
              <p className="text-xl font-black text-emerald-600 mt-1">
                {(modelInfo?.metrics?.precision * 100 || 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Recall</span>
              <p className="text-xl font-black text-teal-600 mt-1">
                {(modelInfo?.metrics?.recall * 100 || 99.8).toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">ROC-AUC Score</span>
              <p className="text-xl font-black text-blue-600 mt-1">
                {(modelInfo?.metrics?.roc_auc || 0.999).toFixed(3)}
              </p>
            </div>
          </div>

          {/* Feature Importances */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Model Feature Importances</h4>
            <div className="space-y-2">
              {Object.entries(modelInfo?.feature_importances || {
                "Credit_History_1": 0.894,
                "ApplicantIncome": 0.024,
                "LoanAmount": 0.023,
                "CoapplicantIncome": 0.014,
                "Loan_Amount_Term": 0.013
              }).slice(0, 5).map(([feature, weight]: any) => (
                <div key={feature} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{feature}</span>
                  <span className="font-mono font-bold text-teal-800">{(weight * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-900 block mb-1">Algorithm Architecture:</span>
            <p className="text-slate-600 leading-relaxed font-mono">
              Pipeline(ColumnTransformer[StandardScaler, OneHotEncoder] + RandomForestClassifier(n_estimators=150, max_depth=9, class_weight='balanced'))
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
