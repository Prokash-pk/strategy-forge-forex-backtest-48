
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Wifi, Zap, Server, Database, Activity } from 'lucide-react';
import { DiagnosticResult } from './types';

interface DiagnosticItemProps {
  diagnostic: DiagnosticResult;
}

const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ diagnostic }) => {
  const getIcon = (iconType: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (iconType) {
      case 'user': return <User {...iconProps} />;
      case 'settings': return <Settings {...iconProps} />;
      case 'wifi': return <Wifi {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'server': return <Server {...iconProps} />;
      case 'database': return <Database {...iconProps} />;
      case 'activity': return <Activity {...iconProps} />;
      default: return <Settings {...iconProps} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-600';
      case 'ERROR': return 'bg-red-600';
      case 'WARNING': return 'bg-yellow-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(diagnostic.iconType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-white">{diagnostic.name}</h4>
          <Badge variant="secondary" className={getStatusColor(diagnostic.status)}>
            {diagnostic.status}
          </Badge>
        </div>
        <p className="text-sm text-slate-300">{diagnostic.message}</p>
        {diagnostic.details && (
          <details className="mt-2">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
              View Details
            </summary>
            <pre className="text-xs text-slate-400 mt-1 bg-slate-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(diagnostic.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default DiagnosticItem;
