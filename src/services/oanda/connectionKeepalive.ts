export class OANDAConnectionKeepalive {
  private static instance: OANDAConnectionKeepalive;
  private keepaliveInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private failureCount: number = 0;
  private maxFailures: number = 3; // Reduced from 5 for faster recovery
  private currentConfig: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  } | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;

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
    // Store config for potential restarts
    this.currentConfig = { ...config };

    if (this.isActive) {
      console.log('🔄 OANDA keepalive already active - updating config if needed');
      // Check if config changed, restart if needed
      if (JSON.stringify(this.currentConfig) !== JSON.stringify(config)) {
        console.log('🔄 Config changed, restarting keepalive with new settings');
        this.stopKeepalive();
        return this.startKeepalive(config);
      }
      return;
    }

    this.isActive = true;
    this.failureCount = 0;
    console.log('🚀 Starting persistent OANDA connection keepalive...');

    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // Send initial ping
    await this.sendKeepalivePing(config);

    // Set up persistent keepalive (every 45 seconds for stability)
    this.keepaliveInterval = setInterval(async () => {
      if (this.isActive && this.currentConfig) {
        await this.sendKeepalivePing(this.currentConfig);
      }
    }, 45000); // 45 seconds - more conservative for stability

    console.log('✅ Persistent OANDA keepalive started - connection will stay active across navigation');
  }

  stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.isActive = false;
    this.failureCount = 0;
    this.currentConfig = null;
    console.log('🛑 OANDA keepalive stopped');
  }

  // New method to restart keepalive automatically
  private async restartKeepalive() {
    if (!this.currentConfig) {
      console.log('❌ Cannot restart keepalive - no config stored');
      return;
    }

    console.log('🔄 Attempting to restart OANDA keepalive...');
    this.stopKeepalive();
    
    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (this.currentConfig) {
      await this.startKeepalive(this.currentConfig);
    }
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

      // Use a lightweight endpoint for keepalive
      const response = await fetch(
        `${baseUrl}/v3/accounts/${config.accountId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          // Increased timeout for more reliable connections
          signal: AbortSignal.timeout(15000) // 15 second timeout
        }
      );

      if (response.ok) {
        this.failureCount = 0; // Reset failure count on success
        console.log('💚 OANDA keepalive ping successful - connection maintained');
        
        // Clear any pending retry
        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
          this.retryTimeout = null;
        }
      } else {
        this.handlePingFailure(response.status, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.handlePingFailure(0, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private handlePingFailure(status: number, errorMessage: string) {
    this.failureCount++;
    console.warn(`⚠️ OANDA keepalive ping failed (${this.failureCount}/${this.maxFailures}): ${errorMessage}`);
    
    // If unauthorized, DON'T restart automatically - just log it
    if (status === 401) {
      console.error('🔑 API key authentication failed - user needs to update credentials');
      console.log('🔄 Keepalive will continue running but won\'t auto-restart on auth errors');
      // Don't increment failure count for auth errors to prevent shutdown
      this.failureCount = Math.max(0, this.failureCount - 1);
      return;
    }
    
    if (this.failureCount >= this.maxFailures) {
      console.error(`❌ OANDA keepalive failed ${this.maxFailures} times - attempting restart in 30 seconds`);
      // Instead of stopping completely, try one restart after a longer delay
      this.retryTimeout = setTimeout(() => {
        console.log('🔄 Attempting final keepalive restart...');
        this.restartKeepalive();
      }, 30000); // Wait 30 seconds before final restart attempt
    }
  }

  isKeepaliveActive(): boolean {
    return this.isActive;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  // New method to get current status
  getStatus() {
    return {
      isActive: this.isActive,
      failureCount: this.failureCount,
      hasConfig: !!this.currentConfig,
      intervalActive: !!this.keepaliveInterval,
      retryScheduled: !!this.retryTimeout
    };
  }

  // New method to force restart if needed
  forceRestart() {
    if (this.currentConfig) {
      console.log('🔄 Force restarting OANDA keepalive...');
      this.restartKeepalive();
    } else {
      console.log('❌ Cannot force restart - no configuration available');
    }
  }
}
