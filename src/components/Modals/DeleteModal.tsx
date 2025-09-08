// src/components/Modals/DeleteProductModal.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { Slide, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

interface DeleteModalProps {
    item: { id: number | string, name: string } | null;
    modalTitle?: string;
    modalPrompt?: string;
    notifySuccess?: string;
    notifyError?: string;
    navigateUrl?: string;
    deleteFunction: (id: number) => Promise<{ success: boolean; message?: string }>;
}

function DeleteModal({
    item,
    modalTitle = "Delete Item",
    modalPrompt = "Are you sure you want to delete this item? This action cannot be undone.",
    notifySuccess = "Item deleted successfully.",
    notifyError = "Failed to delete item.",
    navigateUrl,
    deleteFunction,
}: DeleteModalProps) {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle visibility and animation state
    useEffect(() => {
        if (item) {
            setIsVisible(true);
        }
    }, [item]);

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

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    const handleSubmit = async () => {
        if (!item) return;

        setIsDeleting(true);
        try {
            const response = await deleteFunction(Number(item.id));

            if (response?.success) {
                notify('success', notifySuccess);
                handleClose();

                if (navigateUrl) {
                    navigate(LOCAL_PATH_PREFIX + navigateUrl);
                } else {
                    navigate(0);
                }
            } else {
                notify('error', notifyError);
            }
        } catch (error) {
            notify('error', notifyError);
            console.error('Deletion failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsDeleting(false);
        }, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!item) return null;

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
                        <div className="px-6 py-4 bg-gradient-to-r from-red-50/50 to-orange-50/50 border-b border-red-100/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                                        <Trash2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{modalTitle}</h3>
                                        <p className="text-sm text-gray-600">Confirm deletion action</p>
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
                            {/* Warning Icon */}
                            <div className="text-center">
                                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="h-10 w-10 text-red-600" />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="text-center space-y-2">
                                <p className="text-gray-700 leading-relaxed">
                                    {modalPrompt}
                                </p>
                                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                                    <p className="text-sm font-semibold text-red-700">
                                        "{item.name}"
                                    </p>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="p-4 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 rounded-xl border border-amber-100/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-1 bg-amber-100 rounded-lg">
                                        <Shield className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-medium mb-1">Important Notice</p>
                                        <ul className="space-y-1 text-xs text-gray-600">
                                            <li>• This action cannot be undone</li>
                                            <li>• All associated data will be permanently removed</li>
                                            <li>• Please ensure you have a backup if needed</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-200/50 border border-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default DeleteModal;
