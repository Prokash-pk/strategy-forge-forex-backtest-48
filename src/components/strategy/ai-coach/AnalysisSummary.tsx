
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AIStrategyAnalysis } from '@/services/aiStrategyCoach';

interface AnalysisSummaryProps {
  analysis: AIStrategyAnalysis;
}

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysis }) => {
  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/10 text-red-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400';
      case 'low': return 'bg-green-500/10 text-green-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-700/50 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-3">Analysis Summary</h3>
      <p className="text-slate-300 mb-4">{analysis.overallAssessment}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="text-sm text-slate-400">Risk Level</div>
          <Badge className={getRiskLevelColor(analysis.riskLevel)}>
            {analysis.riskLevel.toUpperCase()}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-slate-400">Complexity Score</div>
          <div className="text-white font-medium">{analysis.complexityScore}/100</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-emerald-400 mb-1">Strengths Identified:</div>
          <ul className="text-sm text-slate-300 space-y-1">
            {analysis.strengthsIdentified.map((strength, i) => (
              <li key={i}>• {strength}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-medium text-red-400 mb-1">Issues Found:</div>
          <ul className="text-sm text-slate-300 space-y-1">
            {analysis.weaknessesIdentified.map((weakness, i) => (
              <li key={i}>• {weakness}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSummary;
