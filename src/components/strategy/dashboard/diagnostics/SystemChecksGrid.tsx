
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { DiagnosticResults } from './types';

interface SystemChecksGridProps {
  checks: DiagnosticResults['checks'];
}

const SystemChecksGrid: React.FC<SystemChecksGridProps> = ({ checks }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {checks && Object.entries(checks).map(([checkName, check]: [string, any]) => (
        <div key={checkName} className="p-3 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(check.status)}
            <span className="text-white text-sm font-medium capitalize">
              {checkName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </div>
          <Badge variant={check.status === 'success' ? "default" : check.status === 'warning' ? "secondary" : "destructive"} className="mb-2">
            {check.status.toUpperCase()}
          </Badge>
          <p className="text-xs text-slate-400">
            {check.details}
          </p>
          {check.error && (
            <p className="text-xs text-red-400 mt-1">
              Error: {check.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SystemChecksGrid;
