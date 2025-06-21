
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Play, Zap } from 'lucide-react'; // Humne 'Zap' icon add kiya hai

interface StrategyActionButtonsProps {
  onRunBacktest?: () => void;
  onStartLiveTrade?: () => void; // Naya function add kiya
  onSaveSettings: () => void;
  isRunning?: boolean;
  isSaving: boolean;
  codeChanged: boolean;
  hasCode: boolean;
  disabled?: boolean;
}

const StrategyActionButtons: React.FC<StrategyActionButtonsProps> = ({
  onRunBacktest,
  onStartLiveTrade, // Naye function ko yahan receive kiya
  onSaveSettings,
  isRunning = false,
  isSaving,
  codeChanged,
  hasCode,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      {/* Run Backtest Button (Pehle jaisa hi hai) */}
      {onRunBacktest && (
        <Button
          onClick={onRunBacktest}
          disabled={isRunning || !hasCode || disabled}
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

      {/* NAYA BUTTON: Start Live Trading */}
      {onStartLiveTrade && (
        <Button
          onClick={onStartLiveTrade}
          disabled={isRunning || !hasCode || disabled}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white" // Color badal diya
        >
          <Zap className="h-4 w-4 mr-2" /> {/* Icon badal diya */}
          Start Live Trading
        </Button>
      )}

      {/* Save Settings Button (Pehle jaisa hi hai) */}
      <Button
        onClick={onSaveSettings}
        disabled={isSaving || disabled}
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