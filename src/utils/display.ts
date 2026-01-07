// src/utils/display.ts
// Shared display utilities for consistent value formatting across the application

/**
 * Formats a value for display, showing '—' for null/undefined/empty values
 * @param value - The value to display
 * @returns Formatted string value or '—' for empty values
 */
export const displayValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    return String(value);
};

/**
 * Formats a price value for display
 * @param price - The price value (number or undefined)
 * @returns Formatted price string (e.g., "RM 10.50") or '—' if invalid
 */
export const formatPrice = (price: number | undefined | null): string => {
    if (price !== undefined && price !== null && typeof price === 'number' && !isNaN(price)) {
        return `RM ${price.toFixed(2)}`;
    }
    return '—';
};

/**
 * Formats a date for display in a consistent format
 * @param date - Date string, Date object, or timestamp
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export const formatDate = (
    date: string | Date | number | null | undefined,
    options?: Intl.DateTimeFormatOptions
): string => {
    if (!date) {
        return '—';
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : 
                   typeof date === 'number' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
        return '—';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
};

/**
 * Formats a date and time for display
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string
 */
export const formatDateTime = (
    date: string | Date | number | null | undefined
): string => {
    return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

