
// Helper function to safely format dates
export const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  // If it's already a Date object
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  
  // If it's a string, convert to Date first
  if (typeof date === 'string') {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString();
  }
  
  // Fallback
  return String(date);
};
