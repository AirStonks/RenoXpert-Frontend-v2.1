// src/utils/notifications.ts
// Shared notification utility for consistent toast notifications across the application

import { toast, Slide } from 'react-toastify';
import { TOAST_AUTO_CLOSE } from '../constants/inventory';

/**
 * Displays a toast notification with consistent styling
 * @param type - 'success' or 'error'
 * @param message - The message to display
 */
export const notify = (type: 'success' | 'error', message: string) => {
    (toast[type] as (message: string, options?: object) => void)(message, {
        position: "top-center",
        autoClose: TOAST_AUTO_CLOSE,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: localStorage.getItem('theme'),
        transition: Slide,
    });
};

