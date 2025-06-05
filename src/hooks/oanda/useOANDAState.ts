
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const useOANDAState = (
  config: any,
  selectedStrategy: any,
  connectionStatus: string
) => {
  // Improve configuration checking logic
  const isConfigured = Boolean(config.accountId?.trim() && config.apiKey?.trim());
  
  // Allow test trades as long as we have valid credentials and a strategy
  const canStartTesting = isConfigured && selectedStrategy !== null;

  // Connection status icon
  const getConnectionStatusIcon = () => {
    if (connectionStatus === 'success') {
      return CheckCircle;
    } else if (connectionStatus === 'testing') {
      return Clock;
    } else {
      return XCircle;
    }
  };

  const connectionStatusIcon = getConnectionStatusIcon();

  return {
    isConfigured,
    canStartTesting,
    connectionStatusIcon
  };
};
