
import React from 'react';

interface BacktestProgressProps {
  currentStep: string;
}

const BacktestProgress: React.FC<BacktestProgressProps> = ({ currentStep }) => {
  if (!currentStep) return null;

  return (
    <div className="text-center text-sm text-slate-400 bg-slate-700 p-2 rounded">
      {currentStep}
    </div>
  );
};

export default BacktestProgress;
