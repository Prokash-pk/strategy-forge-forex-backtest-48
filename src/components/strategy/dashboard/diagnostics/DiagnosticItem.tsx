
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { DiagnosticResult } from './types';

interface DiagnosticItemProps {
  diagnostic: DiagnosticResult;
}

const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ diagnostic }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'WARNING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'ERROR': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(diagnostic.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {diagnostic.icon}
          <span className="font-medium">{diagnostic.name}</span>
        </div>
        {getStatusIcon(diagnostic.status)}
      </div>
      <p className="text-sm mb-2">{diagnostic.message}</p>
      
      {diagnostic.details && (
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
            View Details
          </summary>
          <pre className="mt-2 p-2 bg-slate-800/50 rounded text-xs overflow-auto">
            {JSON.stringify(diagnostic.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default DiagnosticItem;
