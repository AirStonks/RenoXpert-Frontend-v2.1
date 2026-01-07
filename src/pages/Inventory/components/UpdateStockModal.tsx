// src\pages\Inventory\components\UpdateStockModal.tsx

import { useState, useEffect, useRef } from 'react';
import { updateInventoryVariant } from '../../../services/api';
import { InventoryVariant } from '../../../types';
import Loading from '../../../components/Loading';
import { KTModal } from '../../../metronic/core';
import { notify } from '../../../utils/notifications';
import { validateStockField } from '../../../utils/validation';
import { handleApiError, formatApiValidationErrors, logError } from '../../../utils/errorHandling';
import { MODAL_CLOSE_DELAY, ACTION_MESSAGES, PLACEHOLDERS } from '../../../constants/inventory';

interface UpdateStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant: InventoryVariant;
    onSuccess?: () => void;
}

interface FormErrors {
    [key: string]: string | undefined;
}

function UpdateStockModal({ isOpen, onClose, variant, onSuccess }: UpdateStockModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const modalInstanceRef = useRef<any>(null);
    const isClosingRef = useRef(false);
    const [formData, setFormData] = useState({
        in_stock: 0,
        projected_stock: 0,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate total balance in real-time: in_stock + projected_stock
    const totalBalance = (formData.in_stock ?? 0) + (formData.projected_stock ?? 0);

    // Initialize modal instance once
    useEffect(() => {
        const modalElement = modalRef.current;
        if (modalElement && !modalInstanceRef.current) {
            try {
                modalInstanceRef.current = new KTModal(modalElement);
            } catch (error) {
                logError('initializing update stock modal', error);
                return;
            }
            
            // Listen for modal hide event to call onClose
            const handleHidden = () => {
                if (!isSubmitting && !isClosingRef.current) {
                    isClosingRef.current = true;
                    // Delay onClose to ensure backdrop cleanup completes
                    setTimeout(() => {
                        onClose();
                        isClosingRef.current = false;
                    }, 100);
                }
            };
            
            modalElement.addEventListener('hidden', handleHidden);
            
            return () => {
                // Always cleanup using captured element reference
                if (modalElement) {
                    modalElement.removeEventListener('hidden', handleHidden);
                }
                // Cleanup modal instance
                if (modalInstanceRef.current) {
                    try {
                        modalInstanceRef.current.hide();
                    } catch (e) {
                        // Ignore errors during cleanup (modal might already be closed)
                    }
                    modalInstanceRef.current = null;
                }
            };
        }
    }, [onClose, isSubmitting]);

    // Control modal visibility and pre-fill form data
    useEffect(() => {
        if (!modalRef.current) return;
        
        if (modalInstanceRef.current) {
            if (isOpen && variant && variant.id) {
                // Reset closing flag when opening
                isClosingRef.current = false;
                try {
                    modalInstanceRef.current.show();
                } catch (error) {
                    logError('showing update stock modal', error);
                }
                
                // Pre-fill with current variant values
                setFormData({
                    in_stock: variant.in_stock ?? 0,
                    projected_stock: variant.projected_stock ?? 0,
                });
                setErrors({});
            } else if (!isOpen) {
                // Only hide if modal is actually open
                if (modalRef.current?.classList.contains('open')) {
                    try {
                        modalInstanceRef.current.hide();
                    } catch (error) {
                        // Ignore errors during cleanup (modal might already be closed)
                        logError('hiding modal', error);
                    }
                }
            }
        }
    }, [isOpen, variant]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Allow empty value or valid number (min 0)
        const numValue = value === '' ? undefined : Number(value);
        
        // Validate: must be non-negative integer
        if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || !Number.isInteger(numValue))) {
            return; // Don't update if invalid
        }
        
        setFormData((prevData) => ({
            ...prevData,
            [name]: numValue
        }));
        
        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = async () => {
        if (!variant.id) return;

        setErrors({});

        // Validate: values must be non-negative integers
        const inStockError = validateStockField(formData.in_stock, 'Current Stock');
        const projectedStockError = validateStockField(formData.projected_stock, 'Projected Stock');
        
        if (inStockError || projectedStockError) {
            setErrors({
                ...(inStockError ? { in_stock: inStockError } : {}),
                ...(projectedStockError ? { projected_stock: projectedStockError } : {}),
            });
            notify('error', 'Please fix the validation errors');
            return;
        }

        setIsSubmitting(true);

        try {
            // Send actual values (not adjustments)
            const stockData: Partial<InventoryVariant> = {
                id: variant.id,
                inventory_item_id: variant.inventory_item_id,
                in_stock: formData.in_stock ?? null,
                projected_stock: formData.projected_stock ?? null,
            };

            const response = await updateInventoryVariant(stockData as InventoryVariant);

            if (response?.success) {
                notify('success', 'Stock updated successfully');
                // Call onSuccess first to trigger refetch
                onSuccess?.();
                // Set closing flag to prevent event listener from calling onClose
                isClosingRef.current = true;
                // Close modal properly using modal instance
                if (modalInstanceRef.current) {
                    // Use setTimeout to ensure onSuccess completes before closing
                    setTimeout(() => {
                        if (modalInstanceRef.current) {
                            modalInstanceRef.current.hide();
                        }
                    }, 50);
                } else {
                    // Fallback to onClose if modal instance not available
                    setTimeout(() => {
                        onClose();
                        isClosingRef.current = false;
                    }, 150);
                }
            } else {
                notify('error', response?.message || 'Failed to update stock');
            }
        } catch (error: unknown) {
            logError('updating stock', error);
            const formattedErrors = formatApiValidationErrors(error);
            if (Object.keys(formattedErrors).length > 0) {
                setErrors(formattedErrors);
            }
            notify('error', handleApiError(error, 'Failed to update stock'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {isSubmitting && <Loading />}

            <div ref={modalRef} className="modal p-14 hidden" data-modal="true" data-modal-backdrop-static="true" id="update_stock_modal">
                <div className="modal-content modal-center-y max-w-5xl max-h-[95%] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {/* Sticky Header */}
                    <div className="modal-header py-4 px-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
                        <span className="text-xl font-bold text-gray-900">Update Stock</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0 hover:bg-gray-100 rounded-full transition-colors"
                            data-modal-dismiss="true"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    {/* Scrollable Body */}
                    <div className="modal-body p-6 overflow-y-auto flex-1">
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Variant Name (Read-only) */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Variant Name
                                    </label>
                                    <input
                                        type="text"
                                        value={variant.variant_name || '-'}
                                        readOnly
                                        disabled
                                        className="input bg-gray-100 cursor-not-allowed"
                                    />
                                </div>

                                {/* Variant SKU (Read-only) */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        SKU
                                    </label>
                                    <input
                                        type="text"
                                        value={variant.sku || '-'}
                                        readOnly
                                        disabled
                                        className="input bg-gray-100 cursor-not-allowed"
                                    />
                                </div>

                                {/* Total Balance (Read-only) - positioned between SKU and editable fields */}
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Total Balance
                                    </label>
                                    <input
                                        type="number"
                                        value={totalBalance}
                                        readOnly
                                        disabled
                                        className="input bg-gray-100 cursor-not-allowed"
                                    />
                                    <span className="text-xs text-gray-500 mt-1 block">
                                        Calculated as: Current Stock + Projected Stock
                                    </span>
                                </div>

                                {/* Current Stock (Editable) */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Current Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="in_stock"
                                        min="0"
                                        step="1"
                                        value={formData.in_stock ?? ''}
                                        onChange={handleChange}
                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.in_stock ? 'border-red-500' : ''}`}
                                        placeholder="Enter current stock"
                                        disabled={isSubmitting}
                                        aria-label="Current stock"
                                        aria-invalid={!!errors.in_stock}
                                        aria-describedby={errors.in_stock ? 'in-stock-error' : undefined}
                                    />
                                    {errors.in_stock && (
                                        <span id="in-stock-error" className="text-red-500 text-sm mt-1 block" role="alert">{errors.in_stock}</span>
                                    )}
                                </div>

                                {/* Projected Stock (Editable) */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Projected Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="projected_stock"
                                        min="0"
                                        step="1"
                                        value={formData.projected_stock ?? ''}
                                        onChange={handleChange}
                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.projected_stock ? 'border-red-500' : ''}`}
                                        placeholder="Enter projected stock"
                                        disabled={isSubmitting}
                                        aria-label="Projected stock"
                                        aria-invalid={!!errors.projected_stock}
                                        aria-describedby={errors.projected_stock ? 'projected-stock-error' : undefined}
                                    />
                                    {errors.projected_stock && (
                                        <span id="projected-stock-error" className="text-red-500 text-sm mt-1 block" role="alert">{errors.projected_stock}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Sticky Footer */}
                    <div className="modal-footer py-4 px-6 border-t border-gray-200 flex justify-end gap-3 bg-white sticky bottom-0 z-10">
                        <button
                            className="btn btn-light border border-gray-300 hover:bg-gray-50 transition-colors"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary hover:bg-primary-dark transition-colors"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? ACTION_MESSAGES.UPDATING : 'Update Stock'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default UpdateStockModal;

