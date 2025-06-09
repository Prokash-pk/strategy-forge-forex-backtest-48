
export class BrowserKeepalive {
  private static instance: BrowserKeepalive;
  private wakeLockSentinel: any = null;
  private intervalId: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private isActive: boolean = false;

  static getInstance(): BrowserKeepalive {
    if (!BrowserKeepalive.instance) {
      BrowserKeepalive.instance = new BrowserKeepalive();
    }
    return BrowserKeepalive.instance;
  }

  async startKeepalive(): Promise<void> {
    if (this.isActive) {
      console.log('🔄 Browser keepalive already active');
      return;
    }

    this.isActive = true;
    console.log('🚀 Starting browser keepalive system...');

    // Method 1: Wake Lock API (modern browsers)
    await this.requestWakeLock();

    // Method 2: Invisible audio context (fallback)
    this.createSilentAudio();

    // Method 3: Periodic activity simulation
    this.startActivitySimulation();

    // Method 4: Prevent page unload warnings
    this.preventPageUnload();

    console.log('✅ Browser keepalive system activated');
    console.log('🖥️ Your computer screen and browser will stay active');
    console.log('💡 Close this tab or call stopKeepalive() to disable');
  }

  stopKeepalive(): void {
    if (!this.isActive) {
      console.log('⏸️ Browser keepalive already inactive');
      return;
    }

    this.isActive = false;
    console.log('🛑 Stopping browser keepalive system...');

    // Release wake lock
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release();
      this.wakeLockSentinel = null;
    }

    // Stop audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Browser keepalive system deactivated');
  }

  private async requestWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        console.log('🔒 Screen wake lock acquired - screen will stay on');
        
        this.wakeLockSentinel.addEventListener('release', () => {
          console.log('⚠️ Screen wake lock released - attempting to re-acquire...');
          if (this.isActive) {
            setTimeout(() => this.requestWakeLock(), 1000);
          }
        });
      } else {
        console.log('⚠️ Wake Lock API not supported - using fallback methods');
      }
    } catch (error) {
      console.log('⚠️ Could not acquire wake lock:', error);
    }
  }

  private createSilentAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a silent audio buffer
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.loop = true;
      source.start();
      
      console.log('🔇 Silent audio context created - browser will stay active');
    } catch (error) {
      console.log('⚠️ Could not create audio context:', error);
    }
  }

  private startActivitySimulation(): void {
    // Simulate user activity every 30 seconds
    this.intervalId = setInterval(() => {
      if (!this.isActive) return;

      // Dispatch synthetic events to prevent browser throttling
      const events = ['mousemove', 'keydown', 'scroll'];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      document.dispatchEvent(new Event(randomEvent, { bubbles: true }));
      
      // Update page title to show activity
      const now = new Date().toLocaleTimeString();
      document.title = `🟢 Trading Active - ${now}`;
      
      console.log(`🔄 Activity simulation: ${randomEvent} at ${now}`);
    }, 30000); // Every 30 seconds

    console.log('🎯 Activity simulation started - events every 30 seconds');
  }

  private preventPageUnload(): void {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (this.isActive) {
        event.preventDefault();
        event.returnValue = 'Trading session is active. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    console.log('🛡️ Page unload protection enabled');
  }

  getStatus() {
    return {
      isActive: this.isActive,
      hasWakeLock: !!this.wakeLockSentinel,
      hasAudioContext: !!this.audioContext,
      hasInterval: !!this.intervalId
    };
  }
}

// Global functions for easy access
export const startBrowserKeepalive = () => {
  const keepalive = BrowserKeepalive.getInstance();
  return keepalive.startKeepalive();
};

export const stopBrowserKeepalive = () => {
  const keepalive = BrowserKeepalive.getInstance();
  return keepalive.stopKeepalive();
};

// Bind to window for console access
if (typeof window !== 'undefined') {
  const keepalive = BrowserKeepalive.getInstance();
  (window as any).browserKeepalive = keepalive;
  (window as any).startBrowserKeepalive = startBrowserKeepalive;
  (window as any).stopBrowserKeepalive = stopBrowserKeepalive;
  
  console.log('🧪 Browser Keepalive functions available:');
  console.log('   - startBrowserKeepalive()');
  console.log('   - stopBrowserKeepalive()');
  console.log('   - browserKeepalive.getStatus()');
}
