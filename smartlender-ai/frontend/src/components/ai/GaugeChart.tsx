import React from 'react';

interface GaugeChartProps {
  score: number; // 0 to 100
  label?: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ score, label = "Approval Confidence", riskLevel }) => {
  // SVG semi-circle gauge calculation
  const radius = 80;
  const stroke = 14;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return { color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Moderate': return { color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'High': return { color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Severe': return { color: '#EF4444', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default: return { color: '#64748B', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const riskInfo = getRiskColor(riskLevel);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-52 h-32 flex items-end justify-center">
        <svg className="w-52 h-52 overflow-visible transform rotate-180">
          {/* Background track */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Active progress */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            fill="transparent"
            stroke={riskInfo.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center reading */}
        <div className="absolute top-14 text-center">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {score.toFixed(1)}%
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-slate-500">Risk Assessment:</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${riskInfo.bg}`}>
          {riskLevel} Risk
        </span>
      </div>
    </div>
  );
};
