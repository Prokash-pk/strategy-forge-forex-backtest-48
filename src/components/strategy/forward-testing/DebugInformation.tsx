
import React from 'react';
import { Button } from '@/components/ui/button';
import { ConsoleLogger } from '@/services/autoTesting/consoleLogger';

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
    environment?: string;
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
  // Always show debug in development or when explicitly requested
  const showDebug = process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true');
  
  if (!showDebug) {
    return null;
  }

  const handleTestConsoleLog = async () => {
    console.log('🧪 Testing console log cycle manually...');
    await ConsoleLogger.runConsoleLogCycle();
  };

  return (
    <div className="p-3 bg-slate-700/30 rounded text-xs font-mono">
      <div className="text-yellow-300 font-semibold mb-2">🔧 Debug Information:</div>
      <div className="space-y-1 text-slate-300">
        <div>• Configured: <span className={isConfigured ? 'text-green-400' : 'text-red-400'}>{isConfigured ? 'Yes' : 'No'}</span></div>
        <div>• Strategy: <span className={selectedStrategy ? 'text-green-400' : 'text-red-400'}>{selectedStrategy?.strategy_name || 'None'}</span></div>
        <div>• Symbol: <span className="text-blue-400">{selectedStrategy?.symbol || 'None'}</span></div>
        <div>• Connection: <span className={connectionStatus === 'success' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span></div>
        <div>• Environment: <span className="text-purple-400">{config.environment || 'Not set'}</span></div>
        <div>• Account ID: <span className={config.accountId ? 'text-green-400' : 'text-red-400'}>{config.accountId ? 'Set' : 'Missing'}</span></div>
        <div>• API Key: <span className={config.apiKey ? 'text-green-400' : 'text-red-400'}>{config.apiKey ? 'Set' : 'Missing'}</span></div>
        <div>• Button Disabled: <span className={isButtonDisabled ? 'text-red-400' : 'text-green-400'}>{isButtonDisabled ? 'Yes' : 'No'}</span></div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-slate-600">
        <Button 
          onClick={handleTestConsoleLog}
          size="sm"
          variant="outline"
          className="text-xs h-6 px-2 bg-slate-600 hover:bg-slate-500"
        >
          🧪 Test Console Log
        </Button>
      </div>
      
      <div className="mt-2 pt-2 border-t border-slate-600">
        <div className="text-yellow-300 text-xs">💡 Add ?debug=true to URL to always show this panel</div>
        <div className="text-green-300 text-xs mt-1">📝 Console logs appear every minute when trading is active</div>
        <div className="text-blue-300 text-xs">🧪 Use the test button above to check console logging manually</div>
      </div>
    </div>
  );
};
