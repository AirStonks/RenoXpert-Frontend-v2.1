// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchProperty } from '../services/api';
import { Property } from '../types';

const useFetchProperty = (propertyId: number | null) => {
    const [propertyDetail, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortController = new AbortController();

    useEffect(() => {
        if (propertyId === null) {
            setLoading(false); // No need to load if propertyId is null
            setProperty(null);
            setError(null);
            return; // Exit early
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await fetchProperty(propertyId, abortController.signal);
                setProperty(data.data);
                setLoading(false);
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Fetch aborted');
                } else {
                    setError('Failed to fetch property');
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            abortController.abort();
        };

    }, [propertyId]);

    return { propertyDetail, loading, error, abort: () => abortController.abort() };
};

export default useFetchProperty;