// src/utils/errorHandling.ts
// Shared error handling utilities for consistent error processing across the application

/**
 * Extracts and formats API error messages from error responses
 * @param error - The error object from API calls
 * @param defaultMessage - Default message if no specific error message is found
 * @returns Formatted error message string
 */
export const handleApiError = (error: any, defaultMessage: string): string => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return defaultMessage;
};

/**
 * Translates technical error messages to user-friendly messages
 * @param errorMessage - The raw error message from API
 * @param fieldName - The field name for context-specific messages
 * @returns User-friendly error message
 */
export const translateErrorMessage = (errorMessage: string, fieldName?: string): string => {
    const message = errorMessage.toLowerCase();
    
    // Handle PHP preg_match errors
    if (message.includes('preg_match') || message.includes('no ending delimiter')) {
        if (fieldName === 'shelf_level') {
            return 'Shelf Level must be 1 letter (A-Z) or numbers 1-99';
        }
        if (fieldName === 'rack_no') {
            return 'Rack No must be 1 letter (A-Z) or numbers 1-99';
        }
        return 'Invalid format. Please check your input.';
    }
    
    // Handle common validation errors
    if (message.includes('required') || message.includes('is required')) {
        const fieldLabel = getFieldLabel(fieldName);
        return `${fieldLabel} is required`;
    }
    
    if (message.includes('invalid') || message.includes('not valid')) {
        const fieldLabel = getFieldLabel(fieldName);
        return `Invalid ${fieldLabel}`;
    }
    
    if (message.includes('must be') || message.includes('should be')) {
        return errorMessage; // Keep as-is if it's already descriptive
    }
    
    // Handle numeric validation
    if (message.includes('must be a number') || message.includes('must be numeric')) {
        const fieldLabel = getFieldLabel(fieldName);
        return `${fieldLabel} must be a number`;
    }
    
    if (message.includes('must be between') || message.includes('must be at least') || message.includes('must not exceed')) {
        return errorMessage; // Keep range messages as-is
    }
    
    // Handle length validation
    if (message.includes('too long') || message.includes('exceeds')) {
        const fieldLabel = getFieldLabel(fieldName);
        return `${fieldLabel} is too long`;
    }
    
    if (message.includes('too short') || message.includes('minimum')) {
        const fieldLabel = getFieldLabel(fieldName);
        return `${fieldLabel} is too short`;
    }
    
    // Return original message if no translation found
    return errorMessage;
};

/**
 * Gets user-friendly field label from field name
 */
const getFieldLabel = (fieldName?: string): string => {
    if (!fieldName) return 'This field';
    
    const labels: { [key: string]: string } = {
        variant_name: 'Variant Name',
        shelf_level: 'Shelf Level',
        rack_no: 'Rack No',
        alert_level: 'Alert Level',
        sku: 'SKU',
        product_id: 'Product ID',
        color: 'Color',
        material: 'Material',
        supply_price: 'Supply Price',
        install_price: 'Install Price',
        in_stock: 'Current Stock',
        projected_stock: 'Projected Stock',
        width: 'Width',
        height: 'Height',
        depth: 'Depth',
        description: 'Description',
    };
    
    return labels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Formats API validation errors into a FormErrors object with translated messages
 * @param error - The error object from API calls
 * @returns Formatted errors object with field names as keys and user-friendly messages
 */
export const formatApiValidationErrors = (error: any): { [key: string]: string | undefined } => {
    const formattedErrors: { [key: string]: string | undefined } = {};
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
        console.log('Error response structure:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.response?.data?.message,
            errors: error.response?.data?.errors,
            data_prop: error.response?.data?.data
        });
    }
    
    // Handle Laravel-style validation errors (422 status)
    if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.keys(serverErrors).forEach((key) => {
            const rawMessage = Array.isArray(serverErrors[key]) 
                ? serverErrors[key][0] 
                : serverErrors[key];
            formattedErrors[key] = translateErrorMessage(rawMessage, key);
        });
    }
    
    // Handle validation errors in data property (alternative Laravel format)
    if (error.response?.data?.data && typeof error.response.data.data === 'object' && !Array.isArray(error.response.data.data)) {
        const validationData = error.response.data.data;
        Object.keys(validationData).forEach((key) => {
            const rawMessage = Array.isArray(validationData[key]) 
                ? validationData[key][0] 
                : validationData[key];
            formattedErrors[key] = translateErrorMessage(rawMessage, key);
        });
    }
    
    // Handle direct error messages (500 errors, general errors)
    // Check for message even if errors or data exist (some APIs return both)
    const hasMessage = error.response?.data?.message;
    const hasErrors = error.response?.data?.errors && Object.keys(error.response.data.errors).length > 0;
    const hasDataErrors = error.response?.data?.data && typeof error.response.data.data === 'object' && !Array.isArray(error.response.data.data) && Object.keys(error.response.data.data).length > 0;
    
    // If we have a message but no field-specific errors, try to map it to fields
    if (hasMessage && !hasErrors && !hasDataErrors) {
        const message = String(error.response.data.message);
        
        // If preg_match error, it's likely a validation error for shelf_level or rack_no
        // This happens when backend regex validation fails - usually means invalid format
        if (message.includes('preg_match') || message.includes('no ending delimiter') || message.includes('delimiter') || message.includes('preg')) {
            // For preg_match errors, these are typically format validation errors
            // Since shelf_level and rack_no both use regex validation, show error on both
            formattedErrors.shelf_level = translateErrorMessage(message, 'shelf_level');
            formattedErrors.rack_no = translateErrorMessage(message, 'rack_no');
        } else {
            // Try to detect which field the error relates to based on message content
            const fieldPatterns: { [key: string]: RegExp[] } = {
                shelf_level: [/shelf[\s_-]?level/i, /shelf/i],
                rack_no: [/rack[\s_-]?no/i, /rack/i],
                variant_name: [/variant[\s_-]?name/i, /variant/i],
                sku: [/sku/i],
                product_id: [/product[\s_-]?id/i, /product/i],
            };
            
            let matchedField: string | null = null;
            for (const [fieldName, patterns] of Object.entries(fieldPatterns)) {
                if (patterns.some(pattern => pattern.test(message))) {
                    matchedField = fieldName;
                    break;
                }
            }
            
            if (matchedField) {
                formattedErrors[matchedField] = translateErrorMessage(message, matchedField);
            } else {
                // General error - try to translate it
                formattedErrors._general = translateErrorMessage(message);
            }
        }
    }
    
    return formattedErrors;
};

/**
 * Logs errors consistently for debugging
 * @param context - Context where the error occurred (e.g., "creating variant")
 * @param error - The error object
 */
export const logError = (context: string, error: any): void => {
    if (process.env.NODE_ENV === 'development') {
        console.error(`Error ${context}:`, error);
    }
    // In production, you might want to send to error tracking service
    // e.g., Sentry.captureException(error);
};

