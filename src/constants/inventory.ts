// src/constants/inventory.ts
// Constants for inventory module

// Debounce delay for search inputs (milliseconds)
export const DEBOUNCE_DELAY = 500;

// Toast notification auto-close time (milliseconds)
export const TOAST_AUTO_CLOSE = 3000;

// Alert level validation constants
export const ALERT_LEVEL_MIN = 0;
export const ALERT_LEVEL_MAX = 1000;

// Inventory status values
export const INVENTORY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

// Modal close delay (milliseconds) - allows animations to complete
export const MODAL_CLOSE_DELAY = 300;

// Form field max lengths
export const MAX_FIELD_LENGTH = {
    NAME: 255,
    DESCRIPTION: 255,
    TYPE: 255,
    STATUS: 255,
} as const;

// Common placeholder texts
export const PLACEHOLDERS = {
    OPTIONAL: '(optional)',
    REQUIRED: 'Required',
    ENTER: 'Enter',
    SELECT: 'Select',
} as const;

// Common status values
export const STATUS_VALUES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

// Common action messages
export const ACTION_MESSAGES = {
    CREATING: 'Creating...',
    UPDATING: 'Updating...',
    DELETING: 'Deleting...',
    LOADING: 'Loading...',
} as const;

