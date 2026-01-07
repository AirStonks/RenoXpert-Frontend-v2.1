// src\pages\Inventory\components\CreateVariantModal.tsx

import { useState, useEffect, useRef } from 'react';
import { createInventoryVariant, fetchInventory } from '../../../services/api';
import { InventoryVariant, Inventory } from '../../../types';
import Loading from '../../../components/Loading';
import { KTModal } from '../../../metronic/core';
import { Package, MapPin, Ruler, DollarSign, FileText, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '../../../utils/notifications';
import { generateSKU } from '../../../utils/sku';
import { validateAlertLevel, validateStockField, validateRequiredField } from '../../../utils/validation';
import { handleApiError, formatApiValidationErrors, logError, translateErrorMessage } from '../../../utils/errorHandling';
import { useCollapsibleSections, CollapsibleSection } from '../../../hooks/useCollapsibleSections';
import { MODAL_CLOSE_DELAY, ACTION_MESSAGES, PLACEHOLDERS } from '../../../constants/inventory';

interface CreateVariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventoryItemId: number;
    inventoryItem?: Inventory;
    onSuccess?: () => void;
}

interface FormErrors {
    [key: string]: string | undefined;
}


function CreateVariantModal({ isOpen, onClose, inventoryItemId, inventoryItem, onSuccess }: CreateVariantModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const modalInstanceRef = useRef<any>(null);
    const isClosingRef = useRef(false);
    const formInitializedRef = useRef(false);
    const [formData, setFormData] = useState<InventoryVariant & { type?: string }>({
        inventory_item_id: inventoryItemId,
        variant_name: '',
        type: inventoryItem?.type || '',
        sku: '',
        description: '',
        product_id: '',
        shelf_level: '',
        rack_no: '',
        alert_level: undefined,
        status: 'active',
        color: '',
        width: undefined,
        height: undefined,
        depth: undefined,
        material: '',
        supply_price: undefined,
        install_price: undefined,
        in_stock: undefined,
        projected_stock: undefined,
    });
    const [priceDisplayValues, setPriceDisplayValues] = useState<{ supply_price?: string; install_price?: string }>({
        supply_price: '',
        install_price: '',
    });
    const [shelfLevelDisplay, setShelfLevelDisplay] = useState<string>('');
    const [rackNoDisplay, setRackNoDisplay] = useState<string>('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parentItem, setParentItem] = useState<Inventory | null>(null);
    const [isLoadingParentItem, setIsLoadingParentItem] = useState(false);
    const { sections, toggleSection } = useCollapsibleSections([
        { id: 'basic', title: 'Basic Information', icon: Package, isOpen: true },
        { id: 'location', title: 'Location & Stock', icon: MapPin, isOpen: true },
        { id: 'dimensions', title: 'Dimensions & Material', icon: Ruler, isOpen: true },
        { id: 'pricing', title: 'Pricing', icon: DollarSign, isOpen: true },
        { id: 'description', title: 'Description', icon: FileText, isOpen: true },
    ]);

    const fieldRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null }>({
        variant_name: null,
        sku: null,
        product_id: null,
        shelf_level: null,
        rack_no: null,
        alert_level: null,
        color: null,
        in_stock: null,
        projected_stock: null,
        width: null,
        height: null,
        depth: null,
        material: null,
        supply_price: null,
        install_price: null,
        description: null,
    });

    const fieldToSectionMap: { [key: string]: string } = {
        variant_name: 'basic',
        sku: 'basic',
        product_id: 'basic',
        shelf_level: 'location',
        rack_no: 'location',
        alert_level: 'location',
        color: 'location',
        in_stock: 'location',
        projected_stock: 'location',
        width: 'dimensions',
        height: 'dimensions',
        depth: 'dimensions',
        material: 'dimensions',
        supply_price: 'pricing',
        install_price: 'pricing',
        description: 'description',
    };

    const focusFirstErrorField = () => {
        const errorFields = Object.keys(errors).filter(key => errors[key] && key !== '_general');
        
        if (errorFields.length === 0) return;
        
        const firstErrorField = errorFields[0];
        const sectionId = fieldToSectionMap[firstErrorField];
        
        if (sectionId) {
            const section = sections.find(s => s.id === sectionId);
            if (section && !section.isOpen) {
                toggleSection(sectionId);
                setTimeout(() => {
                    focusField(firstErrorField);
                }, 350);
            } else {
                setTimeout(() => {
                    focusField(firstErrorField);
                }, 50);
            }
        } else {
            setTimeout(() => {
                focusField(firstErrorField);
            }, 50);
        }
    };

    const focusField = (fieldName: string) => {
        const fieldRef = fieldRefs.current[fieldName];
        if (fieldRef) {
            fieldRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                fieldRef.focus();
                if (fieldRef instanceof HTMLInputElement && fieldRef.type !== 'number') {
                    fieldRef.select();
                }
            }, 100);
        }
    };

    useEffect(() => {
        const loadParentItem = async () => {
            if (inventoryItemId && !inventoryItem) {
                setIsLoadingParentItem(true);
                try {
                    const response = await fetchInventory(inventoryItemId);
                    if (response?.success && response?.data) {
                        setParentItem(response.data);
                    }
                } catch (error) {
                    logError('fetching parent item', error);
                    setParentItem(null);
                } finally {
                    setIsLoadingParentItem(false);
                }
            } else if (inventoryItem) {
                setParentItem(inventoryItem);
            }
        };

        if (isOpen) {
            loadParentItem();
        }
    }, [inventoryItemId, inventoryItem, isOpen]);

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 10;
        
        const initModal = () => {
            const modalElement = modalRef.current;
            if (!modalElement) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    requestAnimationFrame(initModal);
                }
                return;
            }

            if (!modalInstanceRef.current) {
                try {
                    modalInstanceRef.current = new KTModal(modalElement);
                    
                    const handleHidden = () => {
                        if (!isSubmitting && !isClosingRef.current) {
                            isClosingRef.current = true;
                            setTimeout(() => {
                                onClose();
                                isClosingRef.current = false;
                                formInitializedRef.current = false;
                                setErrors({});
                            }, 100);
                        }
                    };
                    
                    modalElement.addEventListener('hidden', handleHidden);
                } catch (error) {
                    logError('initializing create variant modal', error);
                    return;
                }
            }

            if (isOpen && modalInstanceRef.current) {
                isClosingRef.current = false;
                try {
                    modalInstanceRef.current.show();
                } catch (error) {
                    logError('showing create variant modal', error);
                }
            
                const hasErrors = Object.keys(errors).length > 0;
                const hasFormData = !!(formData.variant_name || formData.sku || formData.shelf_level || formData.rack_no || formData.product_id || formData.color || formData.description || formData.alert_level !== undefined || formData.in_stock !== undefined || formData.projected_stock !== undefined || formData.width !== undefined || formData.height !== undefined || formData.depth !== undefined || formData.material || formData.supply_price !== undefined || formData.install_price !== undefined);
                const parentItemType = inventoryItem?.type || parentItem?.type || '';
                
                if (!formInitializedRef.current && !hasErrors && !hasFormData) {
                    setFormData({
                        inventory_item_id: inventoryItemId,
                        variant_name: '',
                        type: parentItemType,
                        sku: '',
                        description: '',
                        product_id: '',
                        shelf_level: '',
                        rack_no: '',
                        alert_level: undefined,
                        status: 'active',
                        color: '',
                        width: undefined,
                        height: undefined,
                        depth: undefined,
                        material: '',
                        supply_price: undefined,
                        install_price: undefined,
                        in_stock: undefined,
                        projected_stock: undefined,
                    });
                    
                    setPriceDisplayValues({
                        supply_price: '',
                        install_price: '',
                    });
                    
                    setShelfLevelDisplay('');
                    setRackNoDisplay('');
                    
                    formInitializedRef.current = true;
                } else if (formInitializedRef.current && parentItemType && formData.type !== parentItemType) {
                    setFormData(prev => ({
                        ...prev,
                        type: parentItemType
                    }));
                }
            } else if (!isOpen && modalInstanceRef.current) {
                if (modalRef.current?.classList.contains('open')) {
                    try {
                        modalInstanceRef.current.hide();
                    } catch (error) {
                        logError('hiding create variant modal', error);
                    }
                }
            }
        };

        requestAnimationFrame(initModal);
    }, [isOpen, inventoryItemId, inventoryItem, parentItem, onClose, isSubmitting, errors, formData.variant_name, formData.sku, formData.shelf_level, formData.rack_no, formData.product_id, formData.color, formData.description, formData.alert_level, formData.in_stock, formData.projected_stock, formData.width, formData.height, formData.depth, formData.material, formData.supply_price, formData.install_price, formData.type]);


    const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = e;
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        
        if (key >= '0' && key <= '9') {
            return;
        }
        
        if (key === '.' && !(e.currentTarget.value.includes('.'))) {
            return;
        }
        
        if (allowedKeys.includes(key) || e.ctrlKey || e.metaKey) {
            return;
        }
        
        e.preventDefault();
    };

    const handleAlertLevelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = e;
        // Allow: backspace, delete, tab, escape, enter, and arrow keys
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        
        // Allow numbers (0-9)
        if (key >= '0' && key <= '9') {
            return;
        }
        
        // Block decimal point, minus sign, plus sign, and 'e' (scientific notation)
        if (['e', 'E', '+', '-', '.'].includes(key)) {
            e.preventDefault();
            return;
        }
        
        // Allow control keys
        if (allowedKeys.includes(key) || e.ctrlKey || e.metaKey) {
            return;
        }
        
        // Block everything else (alphabets, special characters)
        e.preventDefault();
    };

    const handleAlertLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        
        if (inputValue === '') {
            setFormData((prevData) => ({
                ...prevData,
                alert_level: undefined
            }));
            if (errors.alert_level) {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    alert_level: undefined
                }));
            }
            return;
        }
        
        if (!/^\d+$/.test(inputValue)) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                alert_level: 'Alert level must be a whole number (no letters or decimals)'
            }));
            return;
        }
        
        const numValue = parseInt(inputValue, 10);
        
        if (numValue < 0) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                alert_level: 'Alert level must be at least 0'
            }));
            return;
        }
        
        if (numValue > 1000) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                alert_level: 'Alert level must not exceed 1000'
            }));
            return;
        }
        
        setFormData((prevData) => ({
            ...prevData,
            alert_level: numValue
        }));
        if (errors.alert_level) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                alert_level: undefined
            }));
        }
    };


    const handleShelfLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        
        // Remove any non-alphanumeric characters
        value = value.replace(/[^A-Za-z0-9]/g, '');
        
        // Limit to 2 characters max (1 letter OR 2 digits)
        if (value.length > 2) {
            value = value.slice(0, 2);
        }
        
        // Store raw input for processing
        setFormData((prevData) => ({
            ...prevData,
            shelf_level: value
        }));
        
        if (/^[A-Za-z]$/.test(value)) {
            setShelfLevelDisplay(value.toUpperCase());
        } else if (/^[0-9]+$/.test(value)) {
            setShelfLevelDisplay(value);
        } else {
            setShelfLevelDisplay(value);
        }
        
        if (errors.shelf_level) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                shelf_level: undefined
            }));
        }
    };

    const handleShelfLevelBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let value = formData.shelf_level;
        
        if (!value) {
            setShelfLevelDisplay('');
            return;
        }
        
        if (/^[A-Za-z]$/.test(value)) {
            const formatted = value.toUpperCase();
            setFormData((prevData) => ({
                ...prevData,
                shelf_level: formatted
            }));
            setShelfLevelDisplay(formatted);
        } else if (/^[0-9]+$/.test(value)) {
            const num = parseInt(value, 10);
            
            // Only accept 1-99
            if (num >= 1 && num <= 99) {
                // Store the actual number (without leading zero)
                setFormData((prevData) => ({
                    ...prevData,
                    shelf_level: num.toString()
                }));
                
                if (num >= 1 && num <= 9) {
                    setShelfLevelDisplay(num.toString().padStart(2, '0'));
                } else {
                    setShelfLevelDisplay(num.toString());
                }
            } else {
                setFormData((prevData) => ({
                    ...prevData,
                    shelf_level: ''
                }));
                setShelfLevelDisplay('');
            }
        } else {
            setFormData((prevData) => ({
                ...prevData,
                shelf_level: ''
            }));
            setShelfLevelDisplay('');
        }
    };

    const handleRackNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        
        // Remove any non-alphanumeric characters
        value = value.replace(/[^A-Za-z0-9]/g, '');
        
        // Limit to 2 characters max (1 letter OR 2 digits)
        if (value.length > 2) {
            value = value.slice(0, 2);
        }
        
        // Store raw input for processing
        setFormData((prevData) => ({
            ...prevData,
            rack_no: value
        }));
        
        if (/^[A-Za-z]$/.test(value)) {
            setRackNoDisplay(value.toUpperCase());
        } else if (/^[0-9]+$/.test(value)) {
            setRackNoDisplay(value);
        } else {
            setRackNoDisplay(value);
        }
        
        if (errors.rack_no) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                rack_no: undefined
            }));
        }
    };

    const handleRackNoBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let value = formData.rack_no;
        
        if (!value) {
            setRackNoDisplay('');
            return;
        }
        
        if (/^[A-Za-z]$/.test(value)) {
            const formatted = value.toUpperCase();
            setFormData((prevData) => ({
                ...prevData,
                rack_no: formatted
            }));
            setRackNoDisplay(formatted);
        } else if (/^[0-9]+$/.test(value)) {
            const num = parseInt(value, 10);
            
            // Only accept 1-99
            if (num >= 1 && num <= 99) {
                // Store the actual number (without leading zero)
                setFormData((prevData) => ({
                    ...prevData,
                    rack_no: num.toString()
                }));
                
                if (num >= 1 && num <= 9) {
                    setRackNoDisplay(num.toString().padStart(2, '0'));
                } else {
                    setRackNoDisplay(num.toString());
                }
            } else {
                setFormData((prevData) => ({
                    ...prevData,
                    rack_no: ''
                }));
                setRackNoDisplay('');
            }
        } else {
            setFormData((prevData) => ({
                ...prevData,
                rack_no: ''
            }));
            setRackNoDisplay('');
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        let processedValue = value;
        
        if (processedValue === '') {
            setPriceDisplayValues((prev) => ({
                ...prev,
                [name]: ''
            }));
            setFormData((prevData) => ({
                ...prevData,
                [name]: undefined
            }));
            if (errors[name]) {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    [name]: undefined
                }));
            }
            return;
        }
        
        if (processedValue.length > 1) {
            if (processedValue.match(/^0+\.?0+[1-9]/) || processedValue.match(/^0+[1-9]/)) {
                const firstNonZeroIndex = processedValue.search(/[1-9]/);
                if (firstNonZeroIndex !== -1) {
                    processedValue = processedValue.substring(firstNonZeroIndex);
                } else {
                    processedValue = processedValue.replace(/^0+\.?0*/, '');
                }
            } else if (processedValue === '0.') {
                processedValue = processedValue;
            }
        }
        
        const priceRegex = /^\d+(\.\d{0,2})?$|^\d+\.$/;
        
        if (!priceRegex.test(processedValue)) {
            return;
        }
        
        setPriceDisplayValues((prev) => ({
            ...prev,
            [name]: processedValue
        }));
        
        if (!processedValue.endsWith('.')) {
            const numValue = parseFloat(processedValue);
            if (!isNaN(numValue)) {
                setFormData((prevData) => ({
                    ...prevData,
                    [name]: numValue
                }));
            }
        }
        
        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: undefined
            }));
        }
    };

    const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (value === '' || value === null || value === undefined) {
            setPriceDisplayValues((prev) => ({
                ...prev,
                [name]: ''
            }));
            setFormData((prevData) => ({
                ...prevData,
                [name]: undefined
            }));
            return;
        }
        
        let processedValue = value.endsWith('.') ? value.slice(0, -1) : value;
        const numValue = parseFloat(processedValue);
        if (!isNaN(numValue)) {
            const formattedValue = numValue.toFixed(2);
            setPriceDisplayValues((prev) => ({
                ...prev,
                [name]: formattedValue
            }));
            setFormData((prevData) => ({
                ...prevData,
                [name]: numValue
            }));
        } else {
            setPriceDisplayValues((prev) => ({
                ...prev,
                [name]: ''
            }));
            setFormData((prevData) => ({
                ...prevData,
                [name]: undefined
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'supply_price' || name === 'install_price') {
            handlePriceChange(e as React.ChangeEvent<HTMLInputElement>);
            return;
        }
        
        // Handle alert_level separately with its own validation
        if (name === 'alert_level') {
            handleAlertLevelChange(e as React.ChangeEvent<HTMLInputElement>);
            return;
        }
        
        // Handle shelf_level and rack_no separately with their own validation
        if (name === 'shelf_level') {
            handleShelfLevelChange(e as React.ChangeEvent<HTMLInputElement>);
            return;
        }
        
        if (name === 'rack_no') {
            handleRackNoChange(e as React.ChangeEvent<HTMLInputElement>);
            return;
        }
        
        setFormData((prevData) => {
            let processedValue = value;
            
            if (name === 'sku') {
                processedValue = value.toUpperCase();
            }
            
            const updatedData = {
                ...prevData,
                [name]: (name.includes('price') || name.includes('stock') || name.includes('quantity') || name.includes('width') || name.includes('height') || name.includes('depth'))
                    ? (processedValue === '' ? undefined : Number(processedValue))
                    : processedValue
            };
            
            if (name === 'variant_name') {
                updatedData.sku = generateSKU(value);
            }
            
            return updatedData;
        });
        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: undefined
            }));
        }
    };

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};

        // Validate required fields
        const variantNameError = validateRequiredField(formData.variant_name, 'Variant name');
        if (variantNameError) {
            newErrors.variant_name = variantNameError;
        }

        // Validate SKU format if provided (optional field)
        if (formData.sku && formData.sku.trim() !== '') {
            const skuRegex = /^[A-Z0-9-]+$/;
            if (!skuRegex.test(formData.sku)) {
                newErrors.sku = 'SKU can only contain uppercase letters, numbers, and hyphens';
            }
            if (formData.sku.length > 255) {
                newErrors.sku = 'SKU must not exceed 255 characters';
            }
        }

        // Validate alert_level if provided
        const alertLevelError = validateAlertLevel(formData.alert_level);
        if (alertLevelError) {
            newErrors.alert_level = alertLevelError;
        }

        // Validate stock fields if provided
        const inStockError = validateStockField(formData.in_stock, 'Current Stock');
        if (inStockError) {
            newErrors.in_stock = inStockError;
        }

        const projectedStockError = validateStockField(formData.projected_stock, 'Projected Stock');
        if (projectedStockError) {
            newErrors.projected_stock = projectedStockError;
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        setErrors({});
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            notify('error', 'Please fix the validation errors');
            return;
        }

        setIsSubmitting(true);

        try {
            // Exclude zone from the payload (zone is inherited from parent inventory item)
            // Also exclude sku if it's empty (backend will auto-generate)
            // Set description to null if empty (backend accepts nullable)
            const { zone, ...payloadData } = formData;
            if (!payloadData.sku || payloadData.sku.trim() === '') {
                delete payloadData.sku;
            }
            if (!payloadData.description || payloadData.description.trim() === '') {
                payloadData.description = null;
            }
            
            // Ensure shelf_level and rack_no are stored without leading zeros for numbers
            // Also validate range 1-99
            if (payloadData.shelf_level) {
                const num = parseInt(payloadData.shelf_level, 10);
                if (!isNaN(num) && num >= 1 && num <= 99) {
                    payloadData.shelf_level = num.toString();
                } else if (!isNaN(num)) {
                    // Invalid number (0 or >99), remove it
                    delete payloadData.shelf_level;
                }
            }
            if (payloadData.rack_no) {
                const num = parseInt(payloadData.rack_no, 10);
                if (!isNaN(num) && num >= 1 && num <= 99) {
                    payloadData.rack_no = num.toString();
                } else if (!isNaN(num)) {
                    // Invalid number (0 or >99), remove it
                    delete payloadData.rack_no;
                }
            }
            
            const response = await createInventoryVariant(payloadData);

            if (response?.success) {
                notify('success', 'Variant created successfully');
                onSuccess?.();
                isClosingRef.current = true;
                if (modalInstanceRef.current) {
                    setTimeout(() => {
                        if (modalInstanceRef.current) {
                            modalInstanceRef.current.hide();
                        }
                    }, 50);
                } else {
                    setTimeout(() => {
                        onClose();
                        isClosingRef.current = false;
                    }, MODAL_CLOSE_DELAY);
                }
            } else {
                notify('error', response?.message || 'Failed to create variant');
            }
        } catch (error: unknown) {
            logError('creating variant', error);
            const formattedErrors = formatApiValidationErrors(error);
            
            // Always set errors if we have any, even if it's a general error
            if (Object.keys(formattedErrors).length > 0) {
                setErrors(formattedErrors);
                
                // Focus on first error field after state update (only if not general error)
                const errorFields = Object.keys(formattedErrors).filter(k => k !== '_general');
                if (errorFields.length > 0) {
                    setTimeout(() => {
                        focusFirstErrorField();
                    }, 200);
                }
                
                // Show user-friendly notification
                const errorCount = errorFields.length;
                if (errorCount > 0) {
                    const firstErrorField = errorFields[0];
                    const firstErrorMessage = formattedErrors[firstErrorField];
                    notify('error', firstErrorMessage || `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} in the form`);
                } else if (formattedErrors._general) {
                    notify('error', formattedErrors._general);
                } else {
                    notify('error', handleApiError(error, 'Failed to create variant'));
                }
            } else {
                // No formatted errors, but still show a user-friendly message
                const errorMessage = handleApiError(error, 'Failed to create variant');
                const translatedMessage = translateErrorMessage(errorMessage);
                notify('error', translatedMessage);
                
                // Try to set error on a likely field if it's a preg_match error
                if (errorMessage.includes('preg_match') || errorMessage.includes('delimiter')) {
                    setErrors({
                        shelf_level: translateErrorMessage(errorMessage, 'shelf_level'),
                        rack_no: translateErrorMessage(errorMessage, 'rack_no')
                    });
                    setTimeout(() => {
                        focusFirstErrorField();
                    }, 300);
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Focus on first error when errors change (but not on initial mount)
    useEffect(() => {
        if (Object.keys(errors).length > 0 && isSubmitting === false) {
            const errorFields = Object.keys(errors).filter(key => errors[key] && key !== '_general');
            if (errorFields.length > 0) {
                // Small delay to ensure DOM is updated
                setTimeout(() => {
                    focusFirstErrorField();
                }, 100);
            }
        }
    }, [errors, isSubmitting]);

    const SectionHeader = ({ section }: { section: CollapsibleSection }) => {
        const Icon = section.icon;
        return (
            <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg border-b border-gray-200"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                </div>
                {section.isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>
        );
    };

    return (
        <>
            {isSubmitting && <Loading />}

            <div ref={modalRef} className="modal p-14 hidden" data-modal="true" data-modal-backdrop-static="true" id="create_variant_modal">
                <div className="modal-content modal-center-y max-w-5xl max-h-[95%] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {/* Sticky Header */}
                    <div className="modal-header py-4 px-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
                        <span className="text-xl font-bold text-gray-900">Create Item Variant</span>
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
                            {/* Parent Item Information Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                    Parent Item Information
                                </h3>
                                {isLoadingParentItem ? (
                                    <div className="text-sm text-gray-500">Loading...</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Item Name
                                            </label>
                                            <input
                                                type="text"
                                                value={parentItem?.name || '—'}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Item SKU
                                            </label>
                                            <input
                                                type="text"
                                                value={parentItem?.sku || '—'}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Basic Information Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                            >
                                <SectionHeader section={sections[0]} />
                                <AnimatePresence>
                                    {sections[0].isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Variant Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        ref={(el) => { fieldRefs.current.variant_name = el; }}
                                                        type="text"
                                                        name="variant_name"
                                                        value={formData.variant_name || ''}
                                                        onChange={handleChange}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.variant_name ? 'border-red-500' : ''}`}
                                                        placeholder="Enter variant name"
                                                        aria-label="Variant name"
                                                        aria-required="true"
                                                        aria-invalid={!!errors.variant_name}
                                                        aria-describedby={errors.variant_name ? 'variant-name-error' : undefined}
                                                    />
                                                    {errors.variant_name && (
                                                        <span id="variant-name-error" className="text-red-500 text-sm mt-1 block" role="alert">{errors.variant_name}</span>
                                                    )}
                                                    {/* Full Name Preview */}
                                                    {parentItem?.name && formData.variant_name && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Full Name: {parentItem.name}-{formData.variant_name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Type
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="type"
                                                        value={formData.type || ''}
                                                        readOnly
                                                        className="input w-full bg-gray-100 cursor-not-allowed"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        SKU
                                                    </label>
                                                    <input
                                                        ref={(el) => { fieldRefs.current.sku = el; }}
                                                        type="text"
                                                        name="sku"
                                                        value={formData.sku || ''}
                                                        onChange={handleChange}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.sku ? 'border-red-500' : ''}`}
                                                        placeholder="Auto-generated from variant name if empty"
                                                        aria-label="SKU"
                                                        aria-invalid={!!errors.sku}
                                                        aria-describedby={errors.sku ? 'sku-error' : undefined}
                                                    />
                                                    {errors.sku && (
                                                        <span id="sku-error" className="text-red-500 text-sm mt-1 block" role="alert">{errors.sku}</span>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">Uppercase letters, numbers, and hyphens only</p>
                                                    {/* Full SKU Preview */}
                                                    {parentItem?.sku && formData.sku && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Full SKU: {parentItem.sku}-{formData.sku}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Product ID
                                                    </label>
                                                    <input
                                                        ref={(el) => { fieldRefs.current.product_id = el; }}
                                                        type="text"
                                                        name="product_id"
                                                        value={formData.product_id || ''}
                                                        onChange={handleChange}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.product_id ? 'border-red-500' : ''}`}
                                                        placeholder={`${PLACEHOLDERS.ENTER} product ID ${PLACEHOLDERS.OPTIONAL}`}
                                                    />
                                                    {errors.product_id && (
                                                        <span className="text-red-500 text-sm mt-1 block" role="alert">{errors.product_id}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Location & Stock Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.05 }}
                                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                            >
                                <SectionHeader section={sections[1]} />
                                <AnimatePresence>
                                    {sections[1].isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                        Zone
                                                        <div className="relative group">
                                                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                                            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1.5 px-2 bottom-full left-0 mb-2 z-50 max-w-xs whitespace-normal shadow-lg">
                                                                Zone located in Reno Warehouse
                                                                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-800"></div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={inventoryItem?.zone || '-'}
                                                        className="input w-full bg-gray-100 cursor-not-allowed"
                                                        disabled
                                                        readOnly
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Shelf Level
                                                    </label>
                                                    <input
                                                        ref={(el) => { fieldRefs.current.shelf_level = el; }}
                                                        type="text"
                                                        name="shelf_level"
                                                        value={shelfLevelDisplay}
                                                        onChange={handleShelfLevelChange}
                                                        onBlur={handleShelfLevelBlur}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.shelf_level ? 'border-red-500' : ''}`}
                                                        placeholder="Enter shelf level (e.g., A, B, 01, 12)"
                                                        maxLength={2}
                                                        aria-label="Shelf level"
                                                        aria-invalid={!!errors.shelf_level}
                                                        aria-describedby={errors.shelf_level ? 'shelf-level-error' : undefined}
                                                    />
                                                    {errors.shelf_level ? (
                                                        <span id="shelf-level-error" className="text-red-500 text-sm mt-1 block" role="alert">{errors.shelf_level}</span>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Enter 1 alphabet (A-Z) or numbers 1-99. Numbers 1-9 display as 01-09.
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Rack No
                                                    </label>
                                                    <input
                                                        ref={(el) => { fieldRefs.current.rack_no = el; }}
                                                        type="text"
                                                        name="rack_no"
                                                        value={rackNoDisplay}
                                                        onChange={handleRackNoChange}
                                                        onBlur={handleRackNoBlur}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.rack_no ? 'border-red-500' : ''}`}
                                                        placeholder="Enter rack number (e.g., A, B, 01, 12)"
                                                        maxLength={2}
                                                        aria-label="Rack number"
                                                        aria-invalid={!!errors.rack_no}
                                                        aria-describedby={errors.rack_no ? 'rack-no-error' : undefined}
                                                    />
                                                    {errors.rack_no ? (
                                                        <span id="rack-no-error" className="text-red-500 text-sm mt-1 block" role="alert">{errors.rack_no}</span>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Enter 1 alphabet (A-Z) or numbers 1-99. Numbers 1-9 display as 01-09.
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Alert Level
                                                    </label>
                                                    <input
                                                        ref={(el) => { fieldRefs.current.alert_level = el; }}
                                                        type="number"
                                                        name="alert_level"
                                                        value={formData.alert_level !== undefined && formData.alert_level !== null ? formData.alert_level : ''}
                                                        onChange={handleAlertLevelChange}
                                                        onKeyDown={handleAlertLevelKeyDown}
                                                        min={0}
                                                        max={1000}
                                                        step={1}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.alert_level ? 'border-red-500' : ''}`}
                                                        placeholder={`${PLACEHOLDERS.ENTER} alert level (0-1000)`}
                                                        aria-label="Alert level"
                                                        aria-invalid={!!errors.alert_level}
                                                        aria-describedby={errors.alert_level ? 'alert-level-error' : undefined}
                                                    />
                                                    {errors.alert_level && (
                                                        <span id="alert-level-error" className="text-red-500 text-sm mt-1 block" role="alert">{errors.alert_level}</span>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">Enter a whole number between 0 and 1000 (0 means no alert threshold)</p>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Status
                                                    </label>
                                                    <select
                                                        name="status"
                                                        value={formData.status || 'active'}
                                                        onChange={handleChange}
                                                        className="select w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Color
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="color"
                                                        value={formData.color || ''}
                                                        onChange={handleChange}
                                                        className="input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder={`${PLACEHOLDERS.ENTER} color ${PLACEHOLDERS.OPTIONAL}`}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Current Stock
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="in_stock"
                                                        value={formData.in_stock !== undefined && formData.in_stock !== null ? formData.in_stock : ''}
                                                        onChange={handleChange}
                                                        min={0}
                                                        step={1}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.in_stock ? 'border-red-500' : ''}`}
                                                        placeholder={`${PLACEHOLDERS.ENTER} current stock ${PLACEHOLDERS.OPTIONAL}`}
                                                    />
                                                    {errors.in_stock && (
                                                        <span className="text-red-500 text-sm mt-1 block">{errors.in_stock}</span>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Projected Stock
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="projected_stock"
                                                        value={formData.projected_stock !== undefined && formData.projected_stock !== null ? formData.projected_stock : ''}
                                                        onChange={handleChange}
                                                        min={0}
                                                        step={1}
                                                        className={`input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.projected_stock ? 'border-red-500' : ''}`}
                                                        placeholder={`${PLACEHOLDERS.ENTER} projected stock ${PLACEHOLDERS.OPTIONAL}`}
                                                    />
                                                    {errors.projected_stock && (
                                                        <span className="text-red-500 text-sm mt-1 block">{errors.projected_stock}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Dimensions & Material Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                            >
                                <SectionHeader section={sections[2]} />
                                <AnimatePresence>
                                    {sections[2].isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Width
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="width"
                                                        value={formData.width || ''}
                                                        onChange={handleChange}
                                                        className="input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Height
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="height"
                                                        value={formData.height || ''}
                                                        onChange={handleChange}
                                                        className="input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Depth
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="depth"
                                                        value={formData.depth || ''}
                                                        onChange={handleChange}
                                                        className="input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Material
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="material"
                                                        value={formData.material || ''}
                                                        onChange={handleChange}
                                                        className="input w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder={`${PLACEHOLDERS.ENTER} material ${PLACEHOLDERS.OPTIONAL}`}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Pricing Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.15 }}
                                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                            >
                                <SectionHeader section={sections[3]} />
                                <AnimatePresence>
                                    {sections[3].isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Supply Price
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            name="supply_price"
                                                            value={priceDisplayValues.supply_price || ''}
                                                            onChange={handlePriceChange}
                                                            onBlur={handlePriceBlur}
                                                            onKeyDown={handlePriceKeyDown}
                                                            onFocus={(e) => e.target.select()}
                                                            className="input w-full pl-7 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                            placeholder="0.00 (optional)"
                                                            pattern="[0-9]*\.?[0-9]*"
                                                        />
                                                    </div>
                                                    {errors.supply_price && (
                                                        <span className="text-red-500 text-sm mt-1 block">{errors.supply_price}</span>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        Install Price
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            name="install_price"
                                                            value={priceDisplayValues.install_price || ''}
                                                            onChange={handlePriceChange}
                                                            onBlur={handlePriceBlur}
                                                            onKeyDown={handlePriceKeyDown}
                                                            onFocus={(e) => e.target.select()}
                                                            className="input w-full pl-7 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                            placeholder="0.00 (optional)"
                                                            pattern="[0-9]*\.?[0-9]*"
                                                        />
                                                    </div>
                                                    {errors.install_price && (
                                                        <span className="text-red-500 text-sm mt-1 block">{errors.install_price}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Description Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.2 }}
                                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                            >
                                <SectionHeader section={sections[4]} />
                                <AnimatePresence>
                                    {sections[4].isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-4"
                                        >
                                            <textarea
                                                name="description"
                                                value={formData.description || ''}
                                                onChange={handleChange}
                                                className="textarea w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                placeholder={`${PLACEHOLDERS.ENTER} description ${PLACEHOLDERS.OPTIONAL}`}
                                                rows={4}
                                                aria-label="Description"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
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
                            {isSubmitting ? 'Creating...' : 'Create Variant'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreateVariantModal;
