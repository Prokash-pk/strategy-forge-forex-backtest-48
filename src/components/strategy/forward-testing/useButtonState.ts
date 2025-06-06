
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
  // More granular checks for better debugging
  const hasValidStrategy = Boolean(selectedStrategy?.strategy_name && selectedStrategy?.symbol);
  const hasValidConnection = connectionStatus === 'success';
  const hasValidCredentials = Boolean(config.accountId && config.apiKey);
  
  // Determine if the button should be disabled
  const isButtonDisabled = !isConfigured || 
                           !hasValidStrategy || 
                           !hasValidConnection ||
                           !hasValidCredentials;

  console.log('🔍 Enhanced button state debug:', {
    isConfigured,
    hasValidStrategy,
    strategyName: selectedStrategy?.strategy_name || 'None',
    strategySymbol: selectedStrategy?.symbol || 'None',
    hasValidConnection,
    connectionStatus,
    hasValidCredentials,
    accountIdPresent: !!config.accountId,
    apiKeyPresent: !!config.apiKey,
    environment: config.environment,
    finalButtonDisabled: isButtonDisabled
  });

  return { 
    isButtonDisabled,
    hasValidStrategy,
    hasValidConnection,
    hasValidCredentials 
  };
};
