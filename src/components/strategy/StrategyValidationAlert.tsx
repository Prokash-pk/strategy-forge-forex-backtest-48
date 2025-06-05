
import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StrategyValidationAlertProps {
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    signalStats: {
      totalEntries: number;
      buySignals: number;
      sellSignals: number;
    };
  } | null;
}

const StrategyValidationAlert: React.FC<StrategyValidationAlertProps> = ({ validation }) => {
  if (!validation) return null;

  const { isValid, errors, warnings, signalStats } = validation;

  return (
    <div className="space-y-2 mb-4">
      {/* Validation Status */}
      <div className={`p-3 rounded-lg border ${
        isValid 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            isValid ? 'text-green-300' : 'text-red-300'
          }`}>
            {isValid ? 'Strategy Structure Valid' : 'Strategy Validation Failed'}
          </span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-300 text-sm font-medium mb-1">Errors:</p>
              <ul className="text-red-200 text-xs space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-300 text-sm font-medium mb-1">Warnings:</p>
              <ul className="text-yellow-200 text-xs space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Signal Statistics */}
      {signalStats.totalEntries > 0 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Signal Statistics</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="text-slate-400">Total Entries</div>
              <div className="text-white font-medium">{signalStats.totalEntries}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400">BUY Signals</div>
              <div className="text-green-400 font-medium">{signalStats.buySignals}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400">SELL Signals</div>
              <div className="text-red-400 font-medium">{signalStats.sellSignals}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyValidationAlert;
