
// Market hours utility for forex trading
export interface MarketSession {
  name: string;
  open: string; // HH:MM format in session timezone
  close: string; // HH:MM format in session timezone
  timezone: string;
  days: number[]; // 0=Sunday, 1=Monday, etc.
}

export const FOREX_SESSIONS: MarketSession[] = [
  {
    name: 'Sydney',
    open: '06:00',
    close: '15:00',
    timezone: 'Australia/Sydney',
    days: [1, 2, 3, 4, 5] // Mon-Fri
  },
  {
    name: 'Tokyo',
    open: '09:00',
    close: '18:00', 
    timezone: 'Asia/Tokyo',
    days: [1, 2, 3, 4, 5]
  },
  {
    name: 'London',
    open: '08:00',
    close: '17:00',
    timezone: 'Europe/London', 
    days: [1, 2, 3, 4, 5]
  },
  {
    name: 'New York',
    open: '08:00',
    close: '17:00',
    timezone: 'America/New_York',
    days: [1, 2, 3, 4, 5]
  }
];

export interface MarketStatus {
  isOpen: boolean;
  activeSessions: string[];
  nextOpen: Date | null;
  nextClose: Date | null;
  volume: 'low' | 'medium' | 'high';
}

export function getMarketStatus(date: Date = new Date()): MarketStatus {
  const activeSessions: string[] = [];
  let nextOpen: Date | null = null;
  let nextClose: Date | null = null;

  for (const session of FOREX_SESSIONS) {
    const sessionStatus = isSessionOpen(session, date);
    
    if (sessionStatus.isOpen) {
      activeSessions.push(session.name);
      
      // Track earliest next close
      if (!nextClose || (sessionStatus.nextClose && sessionStatus.nextClose < nextClose)) {
        nextClose = sessionStatus.nextClose;
      }
    } else if (sessionStatus.nextOpen) {
      // Track earliest next open
      if (!nextOpen || sessionStatus.nextOpen < nextOpen) {
        nextOpen = sessionStatus.nextOpen;
      }
    }
  }

  return {
    isOpen: activeSessions.length > 0,
    activeSessions,
    nextOpen,
    nextClose,
    volume: getMarketVolume(activeSessions)
  };
}

function isSessionOpen(session: MarketSession, date: Date) {
  try {
    // Convert current time to session timezone
    const sessionTime = new Date(date.toLocaleString('en-US', { timeZone: session.timezone }));
    const dayOfWeek = sessionTime.getDay();
    
    // Check if it's a trading day
    if (!session.days.includes(dayOfWeek)) {
      return { isOpen: false, nextOpen: getNextSessionOpen(session, date), nextClose: null };
    }

    const [openHour, openMin] = session.open.split(':').map(Number);
    const [closeHour, closeMin] = session.close.split(':').map(Number);
    
    const openTime = new Date(sessionTime);
    openTime.setHours(openHour, openMin, 0, 0);
    
    const closeTime = new Date(sessionTime);
    closeTime.setHours(closeHour, closeMin, 0, 0);
    
    const isOpen = sessionTime >= openTime && sessionTime < closeTime;
    
    return {
      isOpen,
      nextOpen: isOpen ? null : getNextSessionOpen(session, date),
      nextClose: isOpen ? closeTime : null
    };
  } catch (error) {
    console.warn(`Error checking session ${session.name}:`, error);
    return { isOpen: false, nextOpen: null, nextClose: null };
  }
}

function getNextSessionOpen(session: MarketSession, fromDate: Date): Date | null {
  try {
    const [openHour, openMin] = session.open.split(':').map(Number);
    
    // Try today first
    let nextOpen = new Date(fromDate.toLocaleString('en-US', { timeZone: session.timezone }));
    nextOpen.setHours(openHour, openMin, 0, 0);
    
    // If today's session already passed, try tomorrow
    if (nextOpen <= fromDate) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    // Find next valid trading day
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = nextOpen.getDay();
      if (session.days.includes(dayOfWeek)) {
        return nextOpen;
      }
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    return null;
  } catch (error) {
    console.warn(`Error getting next open for ${session.name}:`, error);
    return null;
  }
}

function getMarketVolume(activeSessions: string[]): 'low' | 'medium' | 'high' {
  const sessionCount = activeSessions.length;
  
  // High volume when major sessions overlap
  if (activeSessions.includes('London') && activeSessions.includes('New York')) {
    return 'high'; // London-NY overlap (highest volume)
  }
  if (activeSessions.includes('Tokyo') && activeSessions.includes('London')) {
    return 'high'; // Tokyo-London overlap
  }
  
  // Medium volume with 2+ sessions or major session alone
  if (sessionCount >= 2 || activeSessions.some(s => ['London', 'New York', 'Tokyo'].includes(s))) {
    return 'medium';
  }
  
  // Low volume otherwise
  return sessionCount > 0 ? 'low' : 'low';
}

export function shouldExecuteTrade(marketStatus: MarketStatus, strategy?: any): boolean {
  // Don't trade when markets are closed
  if (!marketStatus.isOpen) {
    return false;
  }
  
  // Strategy-specific rules
  if (strategy?.avoidLowVolume && marketStatus.volume === 'low') {
    return false;
  }
  
  // Avoid trading in the last 30 minutes before market close
  if (marketStatus.nextClose) {
    const timeUntilClose = marketStatus.nextClose.getTime() - Date.now();
    if (timeUntilClose < 30 * 60 * 1000) { // 30 minutes
      return false;
    }
  }
  
  return true;
}

export function formatMarketStatus(status: MarketStatus): string {
  if (!status.isOpen) {
    const nextOpenStr = status.nextOpen 
      ? status.nextOpen.toLocaleString()
      : 'Unknown';
    return `Markets Closed - Next Open: ${nextOpenStr}`;
  }
  
  const sessionsStr = status.activeSessions.join(', ');
  return `Markets Open (${status.volume} volume) - Active: ${sessionsStr}`;
}
