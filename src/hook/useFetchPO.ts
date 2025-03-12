// src/hooks/useFetchProduct.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchPO } from '../services/api';
import { PurchaseOrder } from '../types';

const useFetchPO = (poId: number | null) => {
    const [poDetail, setPo] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch po function
    const fetchPOData = useCallback(() => {
        if (poId) {
            setLoading(true);
            setError(null); // Reset error before fetching
            fetchPO(poId)
                .then((data) => {
                    setPo(data.data);
                    setLoading(false);
                })
                .catch((err) => {
                    setError('Failed to fetch Purchase Order');
                    setLoading(false);
                });
        }
    }, [poId]);


    useEffect(() => {
        fetchPOData();
    }, [poId, fetchPOData]);

    return { poDetail, loading, error, refetch: fetchPOData };
};

export default useFetchPO;
