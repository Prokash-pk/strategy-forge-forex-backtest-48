
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
      this.baseUrl = `https://${config.host}:${config.port}/v1/api`;
      
      console.log('🔗 Connecting to IB Client Portal Gateway...');
      console.log('🔗 Base URL:', this.baseUrl);
      
      const response = await fetch(`${this.baseUrl}/iserver/auth/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      console.log('🔗 Response status:', response.status);
      console.log('🔗 Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connected to Interactive Brokers Client Portal', data);
        this.config.isConnected = true;
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Connection failed with status:', response.status);
        console.error('❌ Error response:', errorText);
        throw new Error(`Connection failed: ${response.status} - ${response.statusText}. Response: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ IB Connection failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error: Make sure IB Client Portal Gateway is running on https://localhost:5000');
        throw new Error('Network error: Cannot reach IB Client Portal Gateway. Make sure it is running and accessible at https://localhost:5000');
      } else if (error.message.includes('CORS')) {
        console.error('❌ CORS error: Browser is blocking the request');
        throw new Error('CORS error: Browser security is blocking the connection. Make sure Client Portal Gateway is configured correctly.');
      }
      
      this.config.isConnected = false;
      throw error;
    }
  }

  static async testConnection(config: IBConfig): Promise<IBConnectionTestResult> {
    try {
      const testUrl = `https://${config.host}:${config.port}/v1/api/iserver/auth/status`;
      console.log('🧪 Testing connection to:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Connection successful! Gateway is accessible and responding.',
          details: data
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: `Gateway responded with error: ${response.status} - ${response.statusText}`,
          details: { status: response.status, error: errorText }
        };
      }
    } catch (error) {
      console.error('🧪 Connection test failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Cannot reach IB Client Portal Gateway. Make sure it is running on the specified host and port.',
          details: { error: error.message }
        };
      }
      
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
