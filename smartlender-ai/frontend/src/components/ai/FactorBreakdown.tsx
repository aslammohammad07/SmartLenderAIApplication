import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ContributingFactor } from '../../types';

interface FactorBreakdownProps {
  factors: ContributingFactor[];
}

export const FactorBreakdown: React.FC<FactorBreakdownProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">No feature attribution data recorded for this evaluation.</p>
    );
  }

  return (
    <div className="space-y-3">
      {factors.map((factor, index) => {
        const isPositive = factor.type === 'positive' || factor.impact === 'Positive';
        const isNegative = factor.type === 'negative' || factor.impact === 'Negative';

        return (
          <div
            key={index}
            className={`p-3.5 rounded-xl border transition-all ${
              isPositive
                ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                : isNegative
                ? 'bg-rose-50/50 border-rose-200/80 text-rose-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : isNegative ? (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span className="font-semibold text-xs tracking-tight">{factor.feature}</span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'bg-emerald-100 text-emerald-800'
                    : isNegative
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {factor.weight}
              </span>
            </div>
            <p className="text-xs text-slate-600 pl-6 leading-relaxed">
              {factor.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};
