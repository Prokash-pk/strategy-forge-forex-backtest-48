export class OANDAConnectionKeepalive {
  private static instance: OANDAConnectionKeepalive;
  private keepaliveInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private failureCount: number = 0;
  private maxFailures: number = 3;
  private currentConfig: {
    accountId: string;
    apiKey: string;
    environment: 'practice' | 'live';
  } | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private resourceExhaustionCount: number = 0;

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
    this.resourceExhaustionCount = 0;
    console.log('🚀 Starting resource-aware OANDA connection keepalive...');

    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // Send initial ping
    await this.sendKeepalivePing(config);

    // Set up adaptive keepalive interval based on resource state
    const baseInterval = this.resourceExhaustionCount > 0 ? 90000 : 60000; // 90s if resources constrained, otherwise 60s
    this.keepaliveInterval = setInterval(async () => {
      if (this.isActive && this.currentConfig) {
        await this.sendKeepalivePing(this.currentConfig);
      }
    }, baseInterval);

    console.log(`✅ Resource-aware OANDA keepalive started with ${baseInterval/1000}s interval`);
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
    this.resourceExhaustionCount = 0;
    this.currentConfig = null;
    console.log('🛑 OANDA keepalive stopped');
  }

  private async restartKeepalive() {
    if (!this.currentConfig) {
      console.log('❌ Cannot restart keepalive - no config stored');
      return;
    }

    console.log('🔄 Attempting to restart OANDA keepalive...');
    this.stopKeepalive();
    
    // Wait longer if we've had resource issues
    const delay = this.resourceExhaustionCount > 0 ? 5000 : 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
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

      // Create abort controller with longer timeout for resource-constrained scenarios
      const timeoutMs = this.resourceExhaustionCount > 0 ? 30000 : 15000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(
          `${baseUrl}/v3/accounts/${config.accountId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          this.failureCount = 0;
          this.resourceExhaustionCount = Math.max(0, this.resourceExhaustionCount - 1); // Gradually reduce
          console.log('💚 OANDA keepalive ping successful - connection maintained');
          
          // Clear any pending retry
          if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
          }
        } else {
          this.handlePingFailure(response.status, `HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          // Handle specific resource exhaustion
          if (fetchError.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
            this.resourceExhaustionCount++;
            console.warn(`🔋 Resource exhaustion detected (${this.resourceExhaustionCount} times) - adapting strategy`);
            
            // Adjust keepalive frequency if resources are constrained
            if (this.resourceExhaustionCount >= 3 && this.keepaliveInterval) {
              console.log('🔄 Switching to low-resource keepalive mode (2-minute intervals)');
              clearInterval(this.keepaliveInterval);
              this.keepaliveInterval = setInterval(async () => {
                if (this.isActive && this.currentConfig) {
                  await this.sendKeepalivePing(this.currentConfig);
                }
              }, 120000); // 2-minute intervals when resource constrained
            }
          }
          
          this.handlePingFailure(0, fetchError.message);
        }
      }
    } catch (error) {
      this.handlePingFailure(0, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private handlePingFailure(status: number, errorMessage: string) {
    // Don't count resource exhaustion as regular failures
    if (!errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
      this.failureCount++;
    }
    
    console.warn(`⚠️ OANDA keepalive ping failed (${this.failureCount}/${this.maxFailures}): ${errorMessage}`);
    
    // If unauthorized, DON'T restart automatically - just log it
    if (status === 401) {
      console.error('🔑 API key authentication failed - user needs to update credentials');
      console.log('🔄 Keepalive will continue running but won\'t auto-restart on auth errors');
      return;
    }
    
    // Handle resource exhaustion separately
    if (errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
      console.log('🔋 Resource exhaustion handled - keepalive will adapt frequency');
      return;
    }
    
    if (this.failureCount >= this.maxFailures) {
      console.error(`❌ OANDA keepalive failed ${this.maxFailures} times - attempting restart in 30 seconds`);
      this.retryTimeout = setTimeout(() => {
        console.log('🔄 Attempting final keepalive restart...');
        this.restartKeepalive();
      }, 30000);
    }
  }

  isKeepaliveActive(): boolean {
    return this.isActive;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getStatus() {
    return {
      isActive: this.isActive,
      failureCount: this.failureCount,
      resourceExhaustionCount: this.resourceExhaustionCount,
      hasConfig: !!this.currentConfig,
      intervalActive: !!this.keepaliveInterval,
      retryScheduled: !!this.retryTimeout
    };
  }

  forceRestart() {
    if (this.currentConfig) {
      console.log('🔄 Force restarting OANDA keepalive...');
      this.restartKeepalive();
    } else {
      console.log('❌ Cannot force restart - no configuration available');
    }
  }
}
