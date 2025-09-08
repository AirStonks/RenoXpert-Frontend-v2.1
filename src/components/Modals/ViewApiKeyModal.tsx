import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Calendar, Hash, Clock, Eye, EyeOff, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiKey } from '../../types';

interface ViewApiKeyModalProps {
    apiKey: ApiKey | null;
}

function ViewApiKeyModal({ apiKey }: ViewApiKeyModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFullKey, setShowFullKey] = useState(false);
    const [copied, setCopied] = useState(false);

    // Handle visibility and animation state
    useEffect(() => {
        if (apiKey) {
            setIsVisible(true);
        }
    }, [apiKey]);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isVisible]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setShowFullKey(false);
            setCopied(false);
        }, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleCopyKey = async () => {
        if (apiKey?.key) {
            try {
                await navigator.clipboard.writeText(apiKey.key);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error('Failed to copy API key:', error);
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (isActive?: boolean, expiresAt?: string) => {
        if (!isActive) {
            return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">Revoked</span>;
        }
        if (expiresAt && new Date(expiresAt) < new Date()) {
            return <span className="px-3 py-1 text-sm font-medium bg-amber-100 text-amber-700 rounded-full">Expired</span>;
        }
        return <span className="px-3 py-1 text-sm font-medium bg-emerald-100 text-emerald-700 rounded-full">Active</span>;
    };

    const getStatusColor = (isActive?: boolean, expiresAt?: string) => {
        if (!isActive) return 'text-red-600';
        if (expiresAt && new Date(expiresAt) < new Date()) return 'text-amber-600';
        return 'text-emerald-600';
    };

    if (!apiKey) return null;

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
                        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-indigo-100/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                        <Key className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">API Key Details</h3>
                                        <p className="text-sm text-gray-600">View complete API key information</p>
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

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* API Key Name */}
                            <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-100/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">{apiKey.name}</h4>
                                        <p className="text-sm text-gray-600">API Key Name</p>
                                    </div>
                                    {getStatusBadge(apiKey.is_active, apiKey.expires_at)}
                                </div>
                            </div>

                            {/* API Key Value */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">API Key</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowFullKey(!showFullKey)}
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                            title={showFullKey ? "Hide API Key" : "Show API Key"}
                                        >
                                            {showFullKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={handleCopyKey}
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                            title="Copy API Key"
                                        >
                                            {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showFullKey ? "text" : "password"}
                                        value={apiKey.key || ''}
                                        readOnly
                                        className="w-full px-4 py-3 font-mono text-sm bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    {showFullKey 
                                        ? "Full API key is visible. Keep it secure and don't share it publicly."
                                        : "Click the eye icon to reveal the full API key"
                                    }
                                </p>
                            </div>

                            {/* Key Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* API Key ID */}
                                <div className="p-4 bg-gradient-to-r from-gray-50/50 to-slate-50/50 rounded-xl border border-gray-100/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">API Key ID</span>
                                    </div>
                                    <p className="text-sm font-mono text-gray-900 bg-white/50 px-2 py-1 rounded-lg">
                                        {apiKey.id}
                                    </p>
                                </div>

                                {/* Key Prefix */}
                                {apiKey.prefix && (
                                    <div className="p-4 bg-gradient-to-r from-gray-50/50 to-slate-50/50 rounded-xl border border-gray-100/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Key className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">Key Prefix</span>
                                        </div>
                                        <p className="text-sm font-mono text-gray-900 bg-white/50 px-2 py-1 rounded-lg">
                                            {apiKey.prefix}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Timestamps */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Timeline Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100/50">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">Created</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{formatDate(apiKey.created_at)}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100/50">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">Last Used</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{formatDate(apiKey.last_used_at)}</span>
                                    </div>
                                    
                                    {apiKey.expires_at && (
                                        <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100/50 md:col-span-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Expires At</span>
                                            </div>
                                            <span className={`text-sm font-medium ${getStatusColor(apiKey.is_active, apiKey.expires_at)}`}>
                                                {formatDate(apiKey.expires_at)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-xl border border-amber-100/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-1 bg-amber-100 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-medium mb-1">Security Reminder</p>
                                        <ul className="space-y-1 text-xs text-gray-600">
                                            <li>• Keep your API key secure and never share it publicly</li>
                                            <li>• Use HTTPS for all API requests</li>
                                            <li>• Monitor your API usage regularly</li>
                                            <li>• Rotate keys periodically for enhanced security</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-200/50 border border-gray-200 rounded-xl transition-all duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ViewApiKeyModal;
