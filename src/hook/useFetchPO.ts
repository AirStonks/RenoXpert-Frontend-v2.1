// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchPO } from '../services/api';
import { PurchaseOrder } from '../types';

const useFetchPO = (id: number) => {
    const [po, setPO] = useState<PurchaseOrder>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchPO(id)
                .then((data) => {
                    setPO(data.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to fetch po');
                    setLoading(false);
                });
        }
    }, [id]);

    return { po, loading, error };
};

export default useFetchPO;
