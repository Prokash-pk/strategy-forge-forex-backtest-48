
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, TestTube } from 'lucide-react';

interface AutoTesterControlsProps {
  isTestingActive: boolean;
  isConfigured: boolean;
  onStartTesting: () => void;
  onStopTesting: () => void;
  onRunSingleTest: () => void;
}

const AutoTesterControls: React.FC<AutoTesterControlsProps> = ({
  isTestingActive,
  isConfigured,
  onStartTesting,
  onStopTesting,
  onRunSingleTest
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      {!isTestingActive ? (
        <Button
          onClick={onStartTesting}
          disabled={!isConfigured}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Play className="h-4 w-4 mr-2" />
          Start Auto Testing
        </Button>
      ) : (
        <Button
          onClick={onStopTesting}
          className="bg-red-600 hover:bg-red-700"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Testing
        </Button>
      )}

      <Button
        onClick={onRunSingleTest}
        disabled={!isConfigured || isTestingActive}
        variant="outline"
        className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
      >
        <TestTube className="h-4 w-4 mr-2" />
        Run Single Test
      </Button>
    </div>
  );
};

export default AutoTesterControls;
