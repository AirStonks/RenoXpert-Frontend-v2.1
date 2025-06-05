import { LucideProps } from 'lucide-react';
import React from 'react';

interface ActionButtonProps {
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    isLoading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
    icon: Icon,
    label,
    onClick,
    variant = 'primary',
    isLoading = false,
    disabled = false,
    fullWidth = false,
}) => {
    const variantStyles = {
        primary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
        secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200',
        danger: 'bg-white hover:bg-red-50 text-red-600 border border-red-100',
    };

    const loadingStyles = {
        primary: 'bg-indigo-400 text-white/80',
        secondary: 'bg-gray-100 text-gray-400',
        danger: 'bg-red-50 text-red-300',
    };

    const getStyles = () => {
        if (disabled || isLoading) {
            return loadingStyles[variant];
        }
        return variantStyles[variant];
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
        ${getStyles()}
        ${fullWidth ? 'w-full' : ''}
        flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
        transition-all duration-300 shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-indigo-200
      `}
        >
            {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-current\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                    <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <Icon size={18} />
            )}
            <span className="font-medium text-sm">{isLoading ? 'Please wait...' : label}</span>
        </button>
    );
};

export default ActionButton;