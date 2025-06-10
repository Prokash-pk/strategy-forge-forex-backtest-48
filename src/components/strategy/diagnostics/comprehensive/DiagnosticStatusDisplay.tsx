
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OverallStatus } from './types';

interface DiagnosticStatusDisplayProps {
  overallStatus: OverallStatus;
}

const DiagnosticStatusDisplay: React.FC<DiagnosticStatusDisplayProps> = ({ overallStatus }) => {
  const getOverallStatusDisplay = () => {
    switch (overallStatus) {
      case 'ready':
        return { color: 'text-green-400', message: '✅ System Ready for Forward Testing' };
      case 'warning':
        return { color: 'text-yellow-400', message: '⚠️ System Functional with Warnings' };
      case 'critical':
        return { color: 'text-red-400', message: '❌ Critical Issues - Forward Testing Blocked' };
      case 'checking':
        return { color: 'text-blue-400', message: '🔍 Running Diagnostics...' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-500/10 text-green-400">PASS</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-400">WARNING</Badge>;
      case 'fail':
        return <Badge className="bg-red-500/10 text-red-400">FAIL</Badge>;
      case 'checking':
        return <Badge className="bg-blue-500/10 text-blue-400">CHECKING</Badge>;
      default:
        return null;
    }
  };

  const overallDisplay = getOverallStatusDisplay();

  return (
    <div className={`${overallDisplay.color} font-medium`}>
      {overallDisplay.message}
    </div>
  );
};

export { DiagnosticStatusDisplay, type DiagnosticStatusDisplayProps };

// Export the utility function for use in other components
export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pass':
      return <Badge className="bg-green-500/10 text-green-400">PASS</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-500/10 text-yellow-400">WARNING</Badge>;
    case 'fail':
      return <Badge className="bg-red-500/10 text-red-400">FAIL</Badge>;
    case 'checking':
      return <Badge className="bg-blue-500/10 text-blue-400">CHECKING</Badge>;
    default:
      return null;
  }
};
