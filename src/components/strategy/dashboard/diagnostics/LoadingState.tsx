
import React from 'react';
import { Search, Clock } from 'lucide-react';

interface LoadingStateProps {
  isRunning: boolean;
  hasResults: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isRunning, hasResults }) => {
  if (isRunning) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
        <p>Running comprehensive diagnostics...</p>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Search className="h-8 w-8 mx-auto mb-2" />
        <p>No diagnostics data available</p>
      </div>
    );
  }

  return null;
};

export default LoadingState;
