import { format, parseISO, isValid } from 'date-fns';

/**
 * Safely formats a date string using date-fns.
 * If the date is invalid or missing, returns a fallback string.
 * @param dateString The date string to format (e.g., from an ISO string or legacy format)
 * @param formatStr The desired output format (default: 'MMM d, yyyy')
 * @param fallback The fallback string to return if formatting fails (default: 'N/A')
 */
export const safeFormat = (
  dateString: string | null | undefined,
  formatStr: string = 'MMM d, yyyy',
  fallback: string = 'N/A'
): string => {
  if (!dateString) return fallback;

  try {
    const date = parseISO(dateString);
    if (isValid(date)) {
      return format(date, formatStr);
    }
    
    // Fallback for non-ISO strings (e.g., relative formats or raw Date objects converted to strings)
    const rawDate = new Date(dateString);
    if (isValid(rawDate)) {
      return format(rawDate, formatStr);
    }
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
  }

  return fallback;
};
