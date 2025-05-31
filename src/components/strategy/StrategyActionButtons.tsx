
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Play } from 'lucide-react';

interface StrategyActionButtonsProps {
  onRunBacktest?: () => void;
  onSaveSettings: () => void;
  isRunning?: boolean;
  isSaving: boolean;
  codeChanged: boolean;
  hasCode: boolean;
}

const StrategyActionButtons: React.FC<StrategyActionButtonsProps> = ({
  onRunBacktest,
  onSaveSettings,
  isRunning = false,
  isSaving,
  codeChanged,
  hasCode
}) => {
  return (
    <div className="space-y-3">
      {onRunBacktest && (
        <Button
          onClick={onRunBacktest}
          disabled={isRunning || !hasCode}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isRunning ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Running Backtest...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {codeChanged ? 'Run Backtest (Code Changed)' : 'Run Backtest'}
            </>
          )}
        </Button>
      )}

      <Button
        onClick={onSaveSettings}
        disabled={isSaving}
        variant="outline"
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        {isSaving ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
};

export default StrategyActionButtons;
