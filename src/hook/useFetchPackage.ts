// src/hooks/useFetchProduct.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchPackage } from '../services/api';
import { Package } from '../types';

const useFetchPackage = (packageId: number | null) => {
    const [packageDetail, setPackage] = useState<Package | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch package function
    const fetchPackageData = useCallback(() => {
        if (packageId) {
            setLoading(true);
            setError(null); // Reset error before fetching
            fetchPackage(packageId)
                .then((data) => {
                    setPackage(data.data);
                    setLoading(false);
                })
                .catch((err) => {
                    setError('Failed to fetch package');
                    setLoading(false);
                });
        }
    }, [packageId]);


    useEffect(() => {
        fetchPackageData();
    }, [packageId, fetchPackageData]);

    return { packageDetail, loading, error, refetch: fetchPackageData };
};

export default useFetchPackage;
