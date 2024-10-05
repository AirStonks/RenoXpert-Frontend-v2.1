// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchSale } from '../services/api';
import { Sale } from '../types';

const useFetchSale = (saleId: number | null) => {
    const [saleDetail, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (saleId === null) {
            setLoading(false); // No need to load if saleId is null
            setSale(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchSale(saleId)
            .then((data) => {
                setSale(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('An unexpected error occured');
                setLoading(false);
            });
    }, [saleId]);

    return { saleDetail, loading, error };
};

export default useFetchSale;
