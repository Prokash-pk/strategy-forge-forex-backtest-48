
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface DiagnosticStatusIconProps {
  status: string;
}

export const DiagnosticStatusIcon: React.FC<DiagnosticStatusIconProps> = ({ status }) => {
  switch (status) {
    case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
  }
};
