// src/utils/validation.ts
// Shared validation utilities for form validation across the application

import { ALERT_LEVEL_MIN, ALERT_LEVEL_MAX, MAX_FIELD_LENGTH } from '../constants/inventory';

/**
 * Validates a stock field (in_stock, projected_stock) to ensure it's a non-negative integer
 * @param value - The value to validate
 * @param fieldName - The name of the field for error messages (e.g., "Current Stock", "Projected Stock")
 * @returns Error message if invalid, undefined if valid
 */
export const validateStockField = (value: number | undefined | null, fieldName: string): string | undefined => {
    if (value !== undefined && value !== null) {
        if (!Number.isInteger(value) || value < 0) {
            return `${fieldName} must be a non-negative whole number`;
        }
    }
    return undefined;
};

/**
 * Validates an alert level field (0-1000, integer only, 0 means no alert threshold)
 * @param value - The alert level value to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateAlertLevel = (value: number | undefined | null): string | undefined => {
    if (value !== undefined && value !== null) {
        if (!Number.isInteger(value)) {
            return 'Alert level must be a whole number (no decimals)';
        }
        if (value < ALERT_LEVEL_MIN) {
            return `Alert level must be at least ${ALERT_LEVEL_MIN}`;
        }
        if (value > ALERT_LEVEL_MAX) {
            return `Alert level must not exceed ${ALERT_LEVEL_MAX}`;
        }
    }
    return undefined;
};

/**
 * Validates a zone field (single uppercase letter A-Z)
 * @param value - The zone value to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateZone = (value: string | undefined | null): string | undefined => {
    if (value && value.trim() !== '') {
        const zoneValue = value.toUpperCase();
        if (!/^[A-Z]$/.test(zoneValue)) {
            return 'Zone must be a single uppercase letter (A-Z)';
        }
    }
    return undefined;
};

/**
 * Validates a required text field
 * @param value - The value to validate
 * @param fieldName - The name of the field for error messages
 * @param maxLength - Optional maximum length
 * @returns Error message if invalid, undefined if valid
 */
export const validateRequiredField = (
    value: string | undefined | null, 
    fieldName: string,
    maxLength?: number
): string | undefined => {
    if (!value || value.trim() === '') {
        return `${fieldName} is required`;
    }
    const maxLen = maxLength || MAX_FIELD_LENGTH.NAME;
    if (value.length > maxLen) {
        return `${fieldName} must not exceed ${maxLen} characters`;
    }
    return undefined;
};

