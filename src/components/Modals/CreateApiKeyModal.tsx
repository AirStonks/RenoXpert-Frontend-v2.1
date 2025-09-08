import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { ApiKeyCreateRequest } from '../../types';

interface CreateApiKeyModalProps {
    onSubmit: (data: ApiKeyCreateRequest) => Promise<void>;
}

function CreateApiKeyModal({ onSubmit }: CreateApiKeyModalProps) {
    const [formData, setFormData] = useState<ApiKeyCreateRequest>({
        name: '',
        expires_at: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Handle visibility and animation state
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'API key name is required';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'API key name must be at least 3 characters';
        }
        
        if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
            newErrors.expires_at = 'Expiration date must be in the future';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            handleClose();
        } catch (error) {
            console.error('Failed to create API key:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setFormData({ name: '', expires_at: '' });
            setErrors({});
            setIsSubmitting(false);
        }, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-blue-100/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                        <Key className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Create New API Key</h3>
                                        <p className="text-sm text-gray-600">Generate a new API key for external access</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-xl transition-all duration-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* API Key Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    API Key Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter a descriptive name"
                                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                            errors.name 
                                                ? 'border-red-300 bg-red-50/50' 
                                                : 'border-gray-200 bg-white/50 hover:border-gray-300 focus:border-blue-500'
                                        }`}
                                    />
                                    {errors.name && (
                                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.name}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Give your API key a descriptive name to help you identify it later
                                </p>
                            </div>

                            {/* Expiration Date */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Expiration Date <span className="text-gray-400">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="datetime-local"
                                        name="expires_at"
                                        value={formData.expires_at}
                                        onChange={handleInputChange}
                                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                            errors.expires_at 
                                                ? 'border-red-300 bg-red-50/50' 
                                                : 'border-gray-200 bg-white/50 hover:border-gray-300 focus:border-blue-500'
                                        }`}
                                    />
                                    {errors.expires_at && (
                                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.expires_at}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Leave empty if you don't want the API key to expire
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-1 bg-blue-100 rounded-lg">
                                        <CheckCircle className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-medium mb-1">Security Best Practices</p>
                                        <ul className="space-y-1 text-xs text-gray-600">
                                            <li>• Use descriptive names for easy identification</li>
                                            <li>• Set expiration dates for temporary access</li>
                                            <li>• Keep your API keys secure and private</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-200/50 border border-gray-200 rounded-xl transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating...
                                        </div>
                                    ) : (
                                        'Create API Key'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CreateApiKeyModal;
