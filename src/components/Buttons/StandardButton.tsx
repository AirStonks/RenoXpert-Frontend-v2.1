// src/components/Buttons/StandardButton.tsx
// Standardized button component for consistent styling across the application

import React from 'react';

export interface StandardButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger' | 'light' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

/**
 * StandardButton component for consistent button styling
 * @param variant - Button style variant
 * @param size - Button size
 * @param disabled - Whether button is disabled
 * @param icon - Optional icon element
 * @param iconPosition - Icon position (left or right)
 */
export const StandardButton: React.FC<StandardButtonProps> = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    icon,
    iconPosition = 'left',
}) => {
    const baseClasses = 'btn transition-colors';
    
    const variantClasses = {
        primary: 'btn-primary hover:bg-primary-dark',
        secondary: 'btn-secondary hover:bg-secondary-dark',
        danger: 'btn-danger hover:bg-red-600',
        light: 'btn-light border border-gray-300 hover:bg-gray-50',
        outline: 'btn-outline hover:bg-gray-50',
    };
    
    const sizeClasses = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
    
    const iconElement = icon && (
        <span className={iconPosition === 'left' ? 'mr-2' : 'ml-2'}>
            {icon}
        </span>
    );
    
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={classes}
        >
            {iconPosition === 'left' && iconElement}
            {children}
            {iconPosition === 'right' && iconElement}
        </button>
    );
};

export default StandardButton;

