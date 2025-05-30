
import React from 'react';
import { Target } from 'lucide-react';

const RecommendationHeader: React.FC = () => {
  return (
    <div className="text-center mb-6">
      <h3 className="text-xl font-semibold text-white mb-2 flex items-center justify-center gap-2">
        <Target className="h-5 w-5 text-blue-400" />
        Strategy Improvement Recommendations
      </h3>
      <p className="text-slate-400">AI-powered suggestions to improve your strategy performance</p>
    </div>
  );
};

export default RecommendationHeader;
