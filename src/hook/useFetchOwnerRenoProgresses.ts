// src/hooks/useFetchOwnerRenoProgresses.ts

import { useState, useEffect } from 'react';
import { retrieveRenoProgresses } from '../services/ownerApi';
import { RenoProgress } from '../types';

const useFetchOwnerRenoProgresses = () => {
    const [renoProgresses, setRenoProgresses] = useState<RenoProgress[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        retrieveRenoProgresses()
            .then((data) => {
                setRenoProgresses(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch renoProgresses');
                setLoading(false);
            });
    }, []);

    return { renoProgresses, loading, error };
};

export default useFetchOwnerRenoProgresses;