// src/hooks/useFetchProduct.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchQuotation } from '../services/api';
import { Quotation } from '../types';

const useFetchQuotation = (quotationId: number | null) => {
    const [quotationDetail, setQuotation] = useState<Quotation | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchQuotationData = useCallback(() => {
        if (quotationId === null) {
            setLoading(false); // No need to load if quotationId is null
            setQuotation(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchQuotation(quotationId)
            .then((data) => {
                setQuotation(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch quotation');
                setLoading(false);
            });
    }, [quotationId]);

    // Call the fetchProductData function on mount and whenever id changes
    useEffect(() => {
        fetchQuotationData();
    }, [quotationId, fetchQuotationData]);

    return { quotationDetail, loading, error, refetch: fetchQuotationData };
};

export default useFetchQuotation;
