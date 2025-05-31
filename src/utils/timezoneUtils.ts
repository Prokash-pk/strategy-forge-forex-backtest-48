
// Timezone utility functions with Singapore timezone focus

export const detectUserTimezone = (): string => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('User timezone detected:', detected);
    return detected;
  } catch (error) {
    console.warn('Could not detect timezone, falling back to Asia/Singapore for forex trading');
    return 'Asia/Singapore';
  }
};

export const formatDateTimeInTimezone = (date: any, timezone?: string): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return String(date);
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Default to Singapore timezone for forex trading consistency
  const targetTimezone = timezone || 'Asia/Singapore';
  
  try {
    return dateObj.toLocaleString('en-US', {
      timeZone: targetTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.warn(`Failed to format in timezone ${targetTimezone}, using fallback`);
    return dateObj.toISOString().replace('T', ' ').slice(0, 19);
  }
};

export const getTimezoneAbbreviation = (timezone?: string): string => {
  const targetTimezone = timezone || 'Asia/Singapore';
  
  try {
    const date = new Date();
    const formatted = date.toLocaleDateString('en-US', {
      timeZone: targetTimezone,
      timeZoneName: 'short'
    });
    
    // Extract timezone abbreviation (e.g., "SGT", "EST", "GMT")
    const match = formatted.match(/\b[A-Z]{3,4}\b/);
    if (match) return match[0];
    
    // Fallback for Singapore timezone
    if (targetTimezone === 'Asia/Singapore') return 'SGT';
    
    return targetTimezone.split('/').pop() || 'UTC';
  } catch (error) {
    console.warn(`Failed to get timezone abbreviation for ${targetTimezone}`);
    return 'UTC';
  }
};

// New function to ensure consistent Singapore timezone for forex data
export const formatForexDateTime = (date: any): string => {
  return formatDateTimeInTimezone(date, 'Asia/Singapore');
};

// New function to check if we're in Singapore market hours
export const isInSingaporeMarketHours = (date?: Date): boolean => {
  const checkDate = date || new Date();
  
  try {
    const singaporeTime = new Date(checkDate.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
    const hour = singaporeTime.getHours();
    const day = singaporeTime.getDay();
    
    // Forex market is open 24/5, but Singapore active hours are roughly 08:00-17:00 SGT
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 17;
  } catch (error) {
    return true; // Default to true if timezone conversion fails
  }
};
