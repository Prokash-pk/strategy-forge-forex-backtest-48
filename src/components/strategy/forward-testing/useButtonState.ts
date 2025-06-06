
export interface StrategySettings {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
}

export interface Config {
  environment: 'practice' | 'live';
  accountId?: string;
  apiKey?: string;
}

export const useButtonState = (
  isConfigured: boolean,
  selectedStrategy: StrategySettings | null,
  connectionStatus: string,
  config: Config
) => {
  // Determine if the button should be disabled
  const isButtonDisabled = !isConfigured || 
                           !selectedStrategy || 
                           connectionStatus !== 'success' ||
                           !config.accountId ||
                           !config.apiKey;

  console.log('🔍 Button state debug:', {
    isConfigured,
    selectedStrategy: !!selectedStrategy,
    connectionStatus,
    accountId: !!config.accountId,
    apiKey: !!config.apiKey,
    isButtonDisabled
  });

  return { isButtonDisabled };
};
