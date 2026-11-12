import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading loan records...", 
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className={`${sizeMap[size]} text-teal-600 animate-spin`} />
      {message && <p className="mt-3 text-xs font-medium text-slate-500 animate-pulse">{message}</p>}
    </div>
  );
};
