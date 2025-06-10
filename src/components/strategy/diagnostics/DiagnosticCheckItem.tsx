
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DiagnosticStatusIcon } from './DiagnosticStatusIcon';
import { DiagnosticCheck } from './types';

interface DiagnosticCheckItemProps {
  check: DiagnosticCheck;
}

export const DiagnosticCheckItem: React.FC<DiagnosticCheckItemProps> = ({ check }) => {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
      <DiagnosticStatusIcon status={check.status} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{check.name}</span>
          {check.critical && <Badge variant="outline" className="text-xs">Critical</Badge>}
        </div>
        <p className="text-sm text-slate-300 mt-1">{check.message}</p>
      </div>
    </div>
  );
};
