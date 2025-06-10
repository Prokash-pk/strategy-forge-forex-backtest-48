
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { OverallStatus } from './types';

interface StatusMessageProps {
  status: OverallStatus;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
  if (status === 'ready') {
    return (
      <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
        <h4 className="text-green-400 font-medium flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          🚀 System Ready for Auto Trading!
        </h4>
        <p className="text-green-300 text-sm mt-2">
          All critical systems are operational. You can now start forward testing and the system will execute real trades based on your Python strategy signals.
        </p>
      </div>
    );
  }

  if (status === 'warning') {
    return (
      <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
        <h4 className="text-yellow-400 font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          ⚠️ Ready with Warnings
        </h4>
        <p className="text-yellow-300 text-sm mt-2">
          Core systems are ready but some non-critical issues were found. Auto trading will work but consider addressing the warnings above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
      <h4 className="text-red-400 font-medium flex items-center gap-2">
        <XCircle className="h-4 w-4" />
        ❌ System Not Ready
      </h4>
      <p className="text-red-300 text-sm mt-2">
        Critical issues prevent auto trading. Please resolve the failed checks above before starting forward testing.
      </p>
    </div>
  );
};
