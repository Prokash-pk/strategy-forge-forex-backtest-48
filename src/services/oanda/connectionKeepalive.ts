export class OANDAConnectionKeepalive {
  private static instance: OANDAConnectionKeepalive;
  private keepaliveInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;

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
    console.log('🚀 Starting OANDA connection keepalive...');

    // Send initial ping
    await this.sendKeepalivePing(config);

    // Set up periodic keepalive (every 45 seconds)
    this.keepaliveInterval = setInterval(async () => {
      if (this.isActive) {
        await this.sendKeepalivePing(config);
      }
    }, 45000); // 45 seconds

    console.log('✅ OANDA keepalive started - connection will stay active');
  }

  stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
    this.isActive = false;
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

      // Lightweight request to keep session alive
      const response = await fetch(
        `${baseUrl}/v3/accounts/${config.accountId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        console.log('💚 OANDA keepalive ping successful');
      } else {
        console.warn('⚠️ OANDA keepalive ping failed:', response.status);
        
        // If unauthorized, stop keepalive to prevent spam
        if (response.status === 401) {
          console.error('❌ OANDA session expired - stopping keepalive');
          this.stopKeepalive();
        }
      }
    } catch (error) {
      console.warn('⚠️ OANDA keepalive ping error:', error);
    }
  }

  isKeepaliveActive(): boolean {
    return this.isActive;
  }
}
