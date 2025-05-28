
// Helper function to safely format dates in Singapore Time
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
  
  // Format in Singapore Time (SGT)
  return dateObj.toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper function to format date and time in Singapore Time
export const formatDateTime = (date: any): string => {
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
  
  // Format in Singapore Time (SGT) with time
  return dateObj.toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
