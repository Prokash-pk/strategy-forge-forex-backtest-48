
export interface MT4Signal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: number;
  strategyName: string;
}

export interface MT4Config {
  host: string;
  port: number;
  isEnabled: boolean;
  defaultLotSize: number;
  maxRisk: number;
  autoTrading: boolean;
}

export class MT4IntegrationService {
  private static config: MT4Config = {
    host: 'localhost',
    port: 9090,
    isEnabled: false,
    defaultLotSize: 0.1,
    maxRisk: 2.0,
    autoTrading: false
  };

  private static ws: WebSocket | null = null;
  private static isConnected: boolean = false;

  static async connect(config: MT4Config): Promise<boolean> {
    try {
      this.config = { ...config };
      
      // Connect to MT4 via WebSocket (DWX_ZeroMQ bridge)
      const wsUrl = `ws://${config.host}:${config.port}`;
      
      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('✅ Connected to MT4 bridge');
          this.isConnected = true;
          this.sendHeartbeat();
          resolve(true);
        };
        
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('📨 MT4 Response:', data);
          this.handleMT4Response(data);
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ MT4 Connection Error:', error);
          this.isConnected = false;
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('🔌 MT4 Connection Closed');
          this.isConnected = false;
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('MT4 Connection failed:', error);
      throw error;
    }
  }

  static disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  static async sendSignal(signal: MT4Signal): Promise<boolean> {
    if (!this.isConnected || !this.ws || !this.config.isEnabled) {
      console.warn('MT4 not connected or disabled');
      return false;
    }

    try {
      const command = {
        action: 'TRADE',
        symbol: signal.symbol,
        cmd: signal.action === 'BUY' ? 0 : signal.action === 'SELL' ? 1 : 6, // 0=BUY, 1=SELL, 6=CLOSE
        volume: signal.lotSize,
        price: 0, // Market price
        slippage: 3,
        sl: signal.stopLoss || 0,
        tp: signal.takeProfit || 0,
        comment: `${signal.strategyName}_${Date.now()}`,
        magic: 12345,
        timestamp: signal.timestamp
      };

      this.ws.send(JSON.stringify(command));
      console.log('📤 Signal sent to MT4:', command);
      
      return true;
    } catch (error) {
      console.error('Failed to send signal to MT4:', error);
      return false;
    }
  }

  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConnected) {
        return { success: false, message: 'Not connected to MT4' };
      }

      // Send test command
      const testCommand = {
        action: 'GET_ACCOUNT_INFO',
        timestamp: Date.now()
      };

      this.ws?.send(JSON.stringify(testCommand));
      
      return { success: true, message: 'Test signal sent successfully' };
    } catch (error) {
      return { success: false, message: `Test failed: ${error}` };
    }
  }

  private static sendHeartbeat(): void {
    if (this.isConnected && this.ws) {
      setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ action: 'HEARTBEAT' }));
        }
      }, 30000); // Every 30 seconds
    }
  }

  private static handleMT4Response(data: any): void {
    // Handle different types of responses from MT4
    switch (data.type) {
      case 'TRADE_RESULT':
        console.log(`Trade ${data.success ? 'SUCCESS' : 'FAILED'}:`, data);
        break;
      case 'ACCOUNT_INFO':
        console.log('Account Info:', data);
        break;
      case 'ERROR':
        console.error('MT4 Error:', data.message);
        break;
      default:
        console.log('MT4 Response:', data);
    }
  }

  static getConfig(): MT4Config {
    return { ...this.config };
  }

  static isConnectedToMT4(): boolean {
    return this.isConnected;
  }

  static processBacktestResults(backtestResults: any, symbol: string, strategyName: string): MT4Signal[] {
    const signals: MT4Signal[] = [];
    
    if (!backtestResults?.entry || !backtestResults?.trade_direction) {
      return signals;
    }

    const { entry, trade_direction, exit } = backtestResults;
    
    for (let i = 0; i < entry.length; i++) {
      // Entry signals
      if (entry[i] && trade_direction[i] && trade_direction[i] !== 'NONE') {
        signals.push({
          symbol,
          action: trade_direction[i] as 'BUY' | 'SELL',
          lotSize: this.config.defaultLotSize,
          timestamp: Date.now() + i * 1000, // Simulate timestamps
          strategyName
        });
      }
      
      // Exit signals
      if (exit?.[i]) {
        signals.push({
          symbol,
          action: 'CLOSE',
          lotSize: this.config.defaultLotSize,
          timestamp: Date.now() + i * 1000,
          strategyName
        });
      }
    }
    
    return signals;
  }
}
