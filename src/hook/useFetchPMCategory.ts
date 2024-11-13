// src/hooks/useFetchProductCategory.ts

import { useState, useEffect } from 'react';
import { fetchPMCategory } from '../services/api';
import { PMCategory } from '../types';

const useFetchPMCategory = () => {
    const [pmCategory, setPMCategory] = useState<PMCategory[]>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            setLoading(true);
            fetchPMCategory(20)
                .then((data) => {
                    setPMCategory(data.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to fetch pm category');
                    setLoading(false);
                });
        };

        fetchCategory();
    }, []);

    return { pmCategory, loading, error };
};

export default useFetchPMCategory;
