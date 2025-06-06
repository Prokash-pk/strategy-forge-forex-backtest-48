
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface StrategySettings {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
}

interface ConfigurationWarningProps {
  isConfigured: boolean;
  selectedStrategy: StrategySettings | null;
  connectionStatus: string;
  config: {
    accountId?: string;
    apiKey?: string;
  };
  onShowGuide: () => void;
}

export const ConfigurationWarning: React.FC<ConfigurationWarningProps> = ({
  isConfigured,
  selectedStrategy,
  connectionStatus,
  config,
  onShowGuide
}) => {
  const getWarningMessage = () => {
    if (!isConfigured) {
      return "Configure OANDA credentials and select a strategy to enable live trading.";
    }
    if (connectionStatus !== 'success') {
      return "Test OANDA connection first to enable live trading.";
    }
    if (!selectedStrategy) {
      return "Select a strategy above to enable live trading.";
    }
    if (!config.accountId || !config.apiKey) {
      return "Complete OANDA configuration (Account ID and API Key required).";
    }
    return "Ready to start live trading!";
  };

  return (
    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
      <div>
        <p className="text-amber-300 text-sm">
          {getWarningMessage()}
        </p>
        {!isConfigured && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowGuide}
            className="text-amber-400 hover:text-amber-300 p-0 h-auto mt-1"
          >
            View Setup Guide →
          </Button>
        )}
      </div>
    </div>
  );
};
