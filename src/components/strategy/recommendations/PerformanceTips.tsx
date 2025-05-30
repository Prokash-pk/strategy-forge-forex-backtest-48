
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const PerformanceTips: React.FC = () => {
  return (
    <div className="text-center text-sm text-slate-400 mt-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span className="text-amber-400 font-medium">Performance Tips</span>
      </div>
      <p>Always test recommendations on historical data before live trading.</p>
      <p>Consider market conditions and your risk tolerance when implementing changes.</p>
    </div>
  );
};

export default PerformanceTips;
