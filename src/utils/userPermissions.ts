// src/utils/userPermissions.ts

import { User } from '../types';

/**
 * Check if the current user is a staff member
 * @param user - The user object
 * @returns boolean indicating if user is staff
 */
export const isStaffUser = (user: User | null): boolean => {
    return user?.type === 'staff';
};

/**
 * Check if the current user has access to Product module
 * @param user - The user object
 * @returns boolean indicating if user can access Product module
 */
export const canAccessProductModule = (user: User | null): boolean => {
    return !isStaffUser(user);
};

/**
 * Check if the current user can see detailed pricing information
 * @param user - The user object
 * @returns boolean indicating if user can see detailed pricing
 */
export const canSeeDetailedPricing = (user: User | null): boolean => {
    return !isStaffUser(user);
};
