
export interface OANDAConnectionState {
  isConnected: boolean;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  lastConnectedAt: string | null;
  connectionError: string | null;
  accountInfo: any | null;
  retryCount: number;
  isAutoReconnecting: boolean;
}

export interface OANDAConnectionContextType extends OANDAConnectionState {
  setConnectionState: (state: Partial<OANDAConnectionState>) => void;
  testConnection: (config: OANDAConfig) => Promise<void>;
  disconnectOANDA: () => void;
  autoReconnect: (config: OANDAConfig) => Promise<void>;
}

export interface OANDAConfig {
  accountId: string;
  apiKey: string;
  environment: 'practice' | 'live';
}

// Constants
export const OANDA_CONNECTION_KEY = 'oanda_connection_state';
export const CONNECTION_HEARTBEAT_INTERVAL = 60000; // 60 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 3000; // 3 seconds
