
import React from 'react';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface DiagnosticHeaderProps {
  isRunning: boolean;
  onRunDiagnostics: () => void;
}

const DiagnosticHeader: React.FC<DiagnosticHeaderProps> = ({ isRunning, onRunDiagnostics }) => {
  return (
    <CardTitle className="flex items-center justify-between text-white text-sm sm:text-base">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        Comprehensive System Diagnostics
      </div>
      <Button
        onClick={onRunDiagnostics}
        disabled={isRunning}
        variant="outline"
        size="sm"
        className="border-slate-600 text-slate-300 hover:text-white"
      >
        <Search className="h-4 w-4 mr-2" />
        {isRunning ? 'Running...' : 'Re-run'}
      </Button>
    </CardTitle>
  );
};

export default DiagnosticHeader;
