// src/hooks/useFetchOrder.ts

import { useState, useEffect } from 'react';
import { fetchRenoProgress } from '../services/api';
import { RenoProgress } from '../types';

const useFetchRenoProgress = (renoProgressId: number | null) => {
    const [renoProgressDetail, setRenoProgress] = useState<RenoProgress | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (renoProgressId === null) {
            setLoading(false); // No need to load if renoProgressId is null
            setRenoProgress(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchRenoProgress(renoProgressId)
            .then((data) => {
                setRenoProgress(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch reno progress');
                setLoading(false);
            });
    }, [renoProgressId]);

    return { renoProgressDetail, loading, error };
};

export default useFetchRenoProgress;
