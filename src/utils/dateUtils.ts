
// Helper function to safely format dates in user's detected timezone
import { formatDateTimeInTimezone, detectUserTimezone } from './timezoneUtils';

export const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  // If it's already a Date object
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    // If it's a string, convert to Date first
    dateObj = new Date(date);
  } else {
    // Fallback
    return String(date);
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Use the auto-detected timezone formatting
  const userTimezone = detectUserTimezone();
  
  try {
    return dateObj.toLocaleDateString('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    // Fallback to basic formatting
    return dateObj.toLocaleDateString();
  }
};

// Helper function to format date and time in user's detected timezone
export const formatDateTime = (date: any): string => {
  if (!date) return 'N/A';
  
  // Use the timezone utilities for consistent formatting
  return formatDateTimeInTimezone(date);
};

// Legacy function - kept for backward compatibility
export const formatDateInSingaporeTime = formatDate;
export const formatDateTimeInSingaporeTime = formatDateTime;
