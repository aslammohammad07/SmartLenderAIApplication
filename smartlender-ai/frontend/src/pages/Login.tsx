import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, 
  ArrowRight, CheckCircle2, AlertCircle, Building2, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@smartlender.bank');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (role: UserRole) => {
    if (role === 'admin') {
      setEmail('admin@smartlender.bank');
      setPassword('Password@123');
    } else if (role === 'loan_manager') {
      setEmail('manager@smartlender.bank');
      setPassword('Password@123');
    } else {
      setEmail('officer@smartlender.bank');
      setPassword('Password@123');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900">
      {/* Left Banking Brand & Security Hero */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#071324] via-[#0A192F] to-[#0D2440] p-8 lg:p-16 flex flex-col justify-between text-white border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-teal-900/40">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">SmartLender<span className="text-teal-400">AI</span></span>
              <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Smarter Lending. Better Decisions.</p>
            </div>
          </div>

          {/* Hero Banner Text */}
          <div className="mt-16 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Enterprise Underwriting Intelligence
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
              AI-Powered Credit Risk & Loan Decision Support System
            </h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              Equip your banking officers and risk underwriters with verified machine learning scoring, debt-to-income stress testing, and real-time audit governance.
            </p>
          </div>

          {/* Institutional Trust Badges */}
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-teal-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold text-white">Scikit-Learn ML Core</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">Trained classification models with 99%+ validated test accuracy.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-bold text-white">Fair Lending Compliant</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">Transparent feature attribution & explainable risk factors.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <span>SmartLenderAI v1.4.2 Enterprise</span>
          <span>Bank Security Protocol TLS 1.3</span>
        </div>
      </div>

      {/* Right Sign-in Form Container */}
      <div className="lg:w-1/2 bg-slate-50 flex items-center justify-center p-6 lg:p-16">
        <div className="max-w-md w-full bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-slate-200/80">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to Portal</h3>
            <p className="text-xs text-slate-500 mt-1">Authenticate with your banking credentials to access underwriting systems</p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mb-6 p-3 rounded-2xl bg-teal-50/70 border border-teal-200/80">
            <p className="text-[11px] font-bold text-teal-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Quick Fill Demo Accounts:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-teal-200 hover:border-teal-400 hover:bg-teal-100/50 transition-all text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('loan_manager')}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-teal-200 hover:border-teal-400 hover:bg-teal-100/50 transition-all text-center"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('loan_officer')}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-teal-200 hover:border-teal-400 hover:bg-teal-100/50 transition-all text-center"
              >
                Officer
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@smartlender.bank"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span>Remember this terminal</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#0A192F] hover:bg-[#132A4A] text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating with Bank Directory...</span>
              ) : (
                <>
                  <span>Sign In to Underwriting Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Restricted to authorized personnel of SmartLenderAI partner institutions. All sessions are monitored and cryptographically audited.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Password Recovery</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              For security compliance, bank account passwords can only be reset by your institution's Administrator via the User Management panel, or using the default demo password:
            </p>
            <div className="mt-3 p-3 bg-slate-100 rounded-xl text-center font-mono font-bold text-slate-800 text-sm">
              Password@123
            </div>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="mt-5 w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
