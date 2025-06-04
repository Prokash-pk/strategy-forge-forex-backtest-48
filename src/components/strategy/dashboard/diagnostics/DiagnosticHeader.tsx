
import React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface DiagnosticHeaderProps {
  onRunDiagnostics: () => void;
  isLoading: boolean;
}

const DiagnosticHeader: React.FC<DiagnosticHeaderProps> = ({ onRunDiagnostics, isLoading }) => {
  return (
    <div className="flex items-center justify-between">
      <p className="text-slate-400 text-sm">
        Full system analysis to diagnose why 226 backtest trades aren't executing live
      </p>
      <Button
        onClick={onRunDiagnostics}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="border-slate-600 text-slate-300 hover:text-white"
      >
        <Search className="h-4 w-4 mr-2" />
        {isLoading ? 'Analyzing...' : 'Re-run Full Diagnosis'}
      </Button>
    </div>
  );
};

export default DiagnosticHeader;
