
import React from 'react';

interface StrategySettings {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
}

interface DebugInformationProps {
  isConfigured: boolean;
  selectedStrategy: StrategySettings | null;
  connectionStatus: string;
  config: {
    accountId?: string;
    apiKey?: string;
  };
  isButtonDisabled: boolean;
}

export const DebugInformation: React.FC<DebugInformationProps> = ({
  isConfigured,
  selectedStrategy,
  connectionStatus,
  config,
  isButtonDisabled
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="p-2 bg-slate-700/30 rounded text-xs text-slate-400">
      <div>Debug Info:</div>
      <div>• Configured: {isConfigured ? 'Yes' : 'No'}</div>
      <div>• Strategy: {selectedStrategy ? 'Selected' : 'None'}</div>
      <div>• Connection: {connectionStatus}</div>
      <div>• Account ID: {config.accountId ? 'Set' : 'Missing'}</div>
      <div>• API Key: {config.apiKey ? 'Set' : 'Missing'}</div>
      <div>• Button Disabled: {isButtonDisabled ? 'Yes' : 'No'}</div>
    </div>
  );
};
