import React, { useEffect } from 'react';
import { XIcon } from 'lucide-react';

interface ErrorToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message, onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slideIn">
            <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-4 flex items-start">
                <div className="flex-grow mr-2">
                    <p className="text-sm font-medium text-gray-900 mb-0.5">Error</p>
                    <p className="text-xs text-gray-600">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <XIcon size={16} className="text-gray-500" />
                </button>
            </div>
        </div>
    );
};

export default ErrorToast;