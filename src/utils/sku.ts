// src/utils/sku.ts
// Shared SKU generation utilities

/**
 * Generates a SKU from a name (matches backend logic)
 * Converts to uppercase, replaces spaces with hyphens, removes invalid characters
 * @param name - The name to convert to SKU
 * @returns Generated SKU string
 */
export const generateSKU = (name: string): string => {
    if (!name) return '';
    
    // Convert to uppercase
    let sku = name.toUpperCase();
    
    // Replace spaces with hyphens
    sku = sku.replace(/\s+/g, '-');
    
    // Remove any characters that are not uppercase letters, numbers, or hyphens
    sku = sku.replace(/[^A-Z0-9-]/g, '');
    
    // Remove multiple consecutive hyphens
    sku = sku.replace(/-+/g, '-');
    
    // Trim hyphens from start and end
    sku = sku.trim().replace(/^-+|-+$/g, '');
    
    return sku;
};

