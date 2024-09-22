// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchPackage } from '../services/api';
import { Package } from '../types';

const useFetchPackage = (packageId: number | null) => {
    const [packageDetail, setProduct] = useState<Package | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (packageId === null) {
            setLoading(false); // No need to load if packageId is null
            setProduct(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchPackage(packageId)
            .then((data) => {
                setProduct(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch product');
                setLoading(false);
            });
    }, [packageId]);

    return { packageDetail, loading, error };
};

export default useFetchPackage;
