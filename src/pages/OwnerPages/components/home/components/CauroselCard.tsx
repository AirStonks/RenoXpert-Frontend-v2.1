import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const CauroselCard: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-6 border-b border-gray-100 ${className}`}>
            {children}
        </div>
    );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-6 bg-gray-50 border-t border-gray-100 ${className}`}>
            {children}
        </div>
    );
};

export default CauroselCard;