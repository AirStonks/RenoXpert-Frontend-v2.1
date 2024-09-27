// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchProperty } from '../services/api';
import { Property } from '../types';

const useFetchProperty = (propertyId: number | null) => {
    const [propertyDetail, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (propertyId === null) {
            setLoading(false); // No need to load if propertyId is null
            setProperty(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchProperty(propertyId)
            .then((data) => {
                setProperty(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch property');
                setLoading(false);
            });
    }, [propertyId]);

    return { propertyDetail, loading, error };
};

export default useFetchProperty;
