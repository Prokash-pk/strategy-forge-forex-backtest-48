
import { IBConfig, IBConnectionTestResult } from '@/types/interactiveBrokers';

export class IBConnectionService {
  private static config: IBConfig = {
    host: 'localhost',
    port: 5000,
    clientId: 1,
    isConnected: false,
    paperTrading: true,
    defaultOrderSize: 10000,
    riskPerTrade: 1.0,
    autoTrading: false
  };

  private static baseUrl: string = '';

  static async connect(config: IBConfig): Promise<boolean> {
    try {
      this.config = { ...config };
      
      // Try both HTTP and HTTPS
      const protocols = ['https', 'http'];
      let connected = false;
      
      for (const protocol of protocols) {
        try {
          this.baseUrl = `${protocol}://${config.host}:${config.port}`;
          console.log(`🔗 Attempting connection to: ${this.baseUrl}`);
          
          // First try to check if the gateway is accessible
          const healthResponse = await fetch(`${this.baseUrl}/v1/api/portal/iserver/account/summary`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'include'
          });

          if (healthResponse.ok || healthResponse.status === 401) {
            // 401 is expected if not authenticated yet, but it means the API is accessible
            console.log(`✅ Gateway accessible via ${protocol}:// - Status: ${healthResponse.status}`);
            
            // Now try the auth status endpoint
            const authResponse = await fetch(`${this.baseUrl}/v1/api/iserver/auth/status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              mode: 'cors',
              credentials: 'include'
            });

            if (authResponse.ok) {
              const data = await authResponse.json();
              console.log('✅ Connected to Interactive Brokers Client Portal', data);
              this.config.isConnected = true;
              connected = true;
              break;
            } else if (authResponse.status === 401) {
              console.log('⚠️ Gateway accessible but authentication required');
              console.log('Please authenticate by visiting:', `${this.baseUrl}/#/`);
              throw new Error(`Authentication required. Please log in at ${this.baseUrl}/#/ first`);
            }
          }
        } catch (protocolError) {
          console.log(`❌ ${protocol}:// failed:`, protocolError.message);
          continue;
        }
      }

      if (!connected) {
        throw new Error('Unable to connect using HTTP or HTTPS. Please check that IB Gateway is running and API is enabled.');
      }

      return true;
    } catch (error) {
      console.error('❌ IB Connection failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error: Cannot reach IB Gateway');
        throw new Error(`Network error: Cannot reach IB Gateway at ${this.config.host}:${this.config.port}. Please ensure:\n1. IB Gateway is running\n2. Web API is enabled\n3. Port ${this.config.port} is correct`);
      } else if (error.message.includes('CORS')) {
        console.error('❌ CORS error: Browser is blocking the request');
        throw new Error('CORS error: Browser security is blocking the connection. Please enable CORS in IB Gateway settings or use the desktop application.');
      }
      
      this.config.isConnected = false;
      throw error;
    }
  }

  static async testConnection(config: IBConfig): Promise<IBConnectionTestResult> {
    try {
      const protocols = ['https', 'http'];
      const ports = [config.port, 5000, 5001, 4000, 8080];
      
      for (const protocol of protocols) {
        for (const port of ports) {
          try {
            const testUrl = `${protocol}://${config.host}:${port}`;
            console.log(`🧪 Testing: ${testUrl}`);
            
            // Test basic connectivity
            const response = await fetch(`${testUrl}/v1/api/portal/iserver/account/summary`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              mode: 'cors',
              credentials: 'include',
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (response.ok || response.status === 401) {
              return {
                success: true,
                message: `✅ Gateway found at ${testUrl}! ${response.status === 401 ? '(Authentication required - please log in first)' : ''}`,
                details: { 
                  url: testUrl, 
                  status: response.status,
                  protocol,
                  port,
                  authRequired: response.status === 401
                }
              };
            }
          } catch (portError) {
            console.log(`Port ${port} with ${protocol}: ${portError.message}`);
            continue;
          }
        }
      }
      
      return {
        success: false,
        message: `❌ Cannot reach IB Gateway. Tested protocols: ${protocols.join(', ')} on ports: ${ports.join(', ')}`,
        details: { 
          testedProtocols: protocols,
          testedPorts: ports,
          suggestion: 'Please ensure IB Gateway is running and Web API is enabled'
        }
      };
    } catch (error) {
      console.error('🧪 Connection test failed:', error);
      
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  static disconnect(): void {
    this.config.isConnected = false;
    this.baseUrl = '';
    console.log('🔌 IB Connection Closed');
  }

  static getConfig(): IBConfig {
    return { ...this.config };
  }

  static isConnected(): boolean {
    return this.config.isConnected;
  }

  static getBaseUrl(): string {
    return this.baseUrl;
  }
}
