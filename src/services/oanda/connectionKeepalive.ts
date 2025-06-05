
export class OANDAConnectionKeepalive {
  private static instance: OANDAConnectionKeepalive;
  private keepaliveInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private failureCount: number = 0;
  private maxFailures: number = 3;

  static getInstance(): OANDAConnectionKeepalive {
    if (!OANDAConnectionKeepalive.instance) {
      OANDAConnectionKeepalive.instance = new OANDAConnectionKeepalive();
    }
    return OANDAConnectionKeepalive.instance;
  }

  async startKeepalive(config: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  }) {
    if (this.isActive) {
      console.log('🔄 OANDA keepalive already active');
      return;
    }

    this.isActive = true;
    this.failureCount = 0;
    console.log('🚀 Starting OANDA connection keepalive...');

    // Send initial ping
    await this.sendKeepalivePing(config);

    // Set up periodic keepalive (every 45 seconds)
    this.keepaliveInterval = setInterval(async () => {
      if (this.isActive) {
        await this.sendKeepalivePing(config);
      }
    }, 30000); // 30 seconds for more frequent pings

    console.log('✅ OANDA keepalive started - connection will stay active');
  }

  stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
    this.isActive = false;
    this.failureCount = 0;
    console.log('🛑 OANDA keepalive stopped');
  }

  private async sendKeepalivePing(config: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  }) {
    try {
      const baseUrl = config.environment === 'practice' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com';

      // Use the accounts endpoint as it's lightweight and always available
      const response = await fetch(
        `${baseUrl}/v3/accounts/${config.accountId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      if (response.ok) {
        this.failureCount = 0; // Reset failure count on success
        console.log('💚 OANDA keepalive ping successful');
      } else {
        this.failureCount++;
        console.warn(`⚠️ OANDA keepalive ping failed (${this.failureCount}/${this.maxFailures}):`, response.status);
        
        // If unauthorized, stop keepalive to prevent spam
        if (response.status === 401) {
          console.error('❌ OANDA session expired - stopping keepalive');
          this.stopKeepalive();
        } else if (this.failureCount >= this.maxFailures) {
          console.error(`❌ OANDA keepalive failed ${this.maxFailures} times - stopping to prevent spam`);
          this.stopKeepalive();
        }
      }
    } catch (error) {
      this.failureCount++;
      console.warn(`⚠️ OANDA keepalive ping error (${this.failureCount}/${this.maxFailures}):`, error);
      
      // Stop if too many failures
      if (this.failureCount >= this.maxFailures) {
        console.error(`❌ OANDA keepalive failed ${this.maxFailures} times - stopping to prevent spam`);
        this.stopKeepalive();
      }
    }
  }

  isKeepaliveActive(): boolean {
    return this.isActive;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}
