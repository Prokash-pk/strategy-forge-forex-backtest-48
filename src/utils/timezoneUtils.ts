
// Timezone utility functions for automatic detection and formatting

export const detectUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect timezone, falling back to UTC');
    return 'UTC';
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
  
  const userTimezone = timezone || detectUserTimezone();
  
  try {
    return dateObj.toLocaleString('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    // Fallback to ISO string if timezone formatting fails
    return dateObj.toISOString().replace('T', ' ').slice(0, 19);
  }
};

export const getTimezoneAbbreviation = (timezone?: string): string => {
  const userTimezone = timezone || detectUserTimezone();
  
  try {
    const date = new Date();
    const formatted = date.toLocaleDateString('en-US', {
      timeZone: userTimezone,
      timeZoneName: 'short'
    });
    
    // Extract timezone abbreviation (e.g., "PST", "EST", "GMT")
    const match = formatted.match(/\b[A-Z]{3,4}\b/);
    return match ? match[0] : userTimezone.split('/').pop() || 'UTC';
  } catch (error) {
    return 'UTC';
  }
};
