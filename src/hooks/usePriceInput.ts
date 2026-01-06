// src/hooks/usePriceInput.ts
// Custom hook for handling price input fields with decimal formatting

import { useState, useCallback } from 'react';

interface UsePriceInputReturn {
    displayValue: string;
    numericValue: number | undefined;
    handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handlePriceBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    handlePriceKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    setDisplayValue: (value: string) => void;
    setNumericValue: (value: number | undefined) => void;
}

export const usePriceInput = (initialValue?: number): UsePriceInputReturn => {
    const [displayValue, setDisplayValue] = useState<string>(
        initialValue !== undefined && initialValue !== null && initialValue !== 0 
            ? initialValue.toString() 
            : ''
    );
    const [numericValue, setNumericValue] = useState<number | undefined>(initialValue);

    const handlePriceKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    }, []);

    const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        let processedValue = value;
        
        if (processedValue === '') {
            setDisplayValue('');
            setNumericValue(undefined);
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
        
        setDisplayValue(processedValue);
        
        if (!processedValue.endsWith('.')) {
            const numValue = parseFloat(processedValue);
            if (!isNaN(numValue)) {
                setNumericValue(numValue);
            }
        }
    }, []);

    const handlePriceBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        const { value } = e.target;
        
        if (value === '' || value === null || value === undefined) {
            setDisplayValue('');
            setNumericValue(undefined);
            return;
        }
        
        let processedValue = value.endsWith('.') ? value.slice(0, -1) : value;
        const numValue = parseFloat(processedValue);
        if (!isNaN(numValue)) {
            const formattedValue = numValue.toFixed(2);
            setDisplayValue(formattedValue);
            setNumericValue(numValue);
        } else {
            setDisplayValue('');
            setNumericValue(undefined);
        }
    }, []);

    return {
        displayValue,
        numericValue,
        handlePriceChange,
        handlePriceBlur,
        handlePriceKeyDown,
        setDisplayValue,
        setNumericValue,
    };
};

