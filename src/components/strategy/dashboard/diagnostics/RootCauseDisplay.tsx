
import React from 'react';
import { DiagnosticResults } from './types';

interface RootCauseDisplayProps {
  rootCause: DiagnosticResults['rootCause'];
}

const RootCauseDisplay: React.FC<RootCauseDisplayProps> = ({ rootCause }) => {
  if (!rootCause) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default: return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getSeverityColor(rootCause.severity)}`}>
      <h3 className={`text-lg font-bold mb-2 ${
        rootCause.severity === 'critical' ? 'text-red-400' :
        rootCause.severity === 'high' ? 'text-orange-400' :
        rootCause.severity === 'info' ? 'text-blue-400' :
        'text-yellow-400'
      }`}>
        🎯 Root Cause: {rootCause.primaryIssue}
      </h3>
      <p className="text-slate-300 mb-2">{rootCause.description}</p>
      <p className="text-white font-medium">
        ➡️ Action Required: {rootCause.action}
      </p>
    </div>
  );
};

export default RootCauseDisplay;
