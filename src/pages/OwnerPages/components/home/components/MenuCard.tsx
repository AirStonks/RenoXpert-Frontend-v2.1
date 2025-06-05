import React, { SVGProps } from 'react';
import { ChevronRightIcon } from 'lucide-react';

interface MenuCardProps {
    icon: React.ComponentType<SVGProps<SVGSVGElement>>; // Type for Lucide React icons
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

const MenuCard: React.FC<MenuCardProps> = ({
    icon: Icon,
    label,
    onClick,
    variant = 'default'
}) => {
    const variantStyles = {
        default: 'bg-white hover:bg-gray-50 text-gray-800',
        danger: 'bg-white hover:bg-red-50 text-gray-800 hover:text-red-600'
    };

    const iconStyles = {
        default: 'text-indigo-500 bg-indigo-50 group-hover:bg-indigo-100',
        danger: 'text-red-500 bg-red-50 group-hover:bg-red-100'
    };

    return (
        <button
            onClick={onClick}
            className={`
        ${variantStyles[variant]}
        group w-full flex items-center justify-between p-4 rounded-xl
        border border-gray-100 shadow-sm hover:shadow-md
        transition-all duration-300 mb-3
      `}
        >
            <div className="flex items-center space-x-3">
                <div className={`
          ${iconStyles[variant]}
          p-2 rounded-lg transition-colors duration-300
        `}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{label}</span>
            </div>
            <ChevronRightIcon size={18} className="text-gray-400 group-hover:text-current transition-colors duration-300" />
        </button>
    );
};

export default MenuCard;