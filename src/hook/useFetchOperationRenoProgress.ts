// src/hooks/useFetchOrder.ts

import { useState, useEffect } from 'react';
import { RenoProgress } from '../types';
import { fetchRenoProgressDetail } from '../services/operationApi';

const useFetchOperationRenoProgress = (renoProgressId: number | null) => {
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
        fetchRenoProgressDetail(renoProgressId)
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

export default useFetchOperationRenoProgress;
