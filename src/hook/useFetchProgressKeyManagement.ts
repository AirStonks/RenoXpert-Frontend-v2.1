// src/hooks/useFetchProgressKeyManagement.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchProgressKeyManagement } from '../services/api';
import { KeyManagement } from '../types';

const useFetchProgressKeyManagement = (renoProgressId: number | null) => {
    const [keyManagementDetail, setKeyManagement] = useState<KeyManagement | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchKeyManagementData = useCallback(() => {
        if (renoProgressId === null) {
            setLoading(false); // No need to load if renoProgressId is null
            setKeyManagement(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchProgressKeyManagement(renoProgressId)
            .then((data) => {
                setKeyManagement(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch key management');
                setLoading(false);
            });
    }, [renoProgressId]);

    useEffect(() => {
        fetchKeyManagementData();
    }, [renoProgressId, fetchKeyManagementData]);

    return { keyManagementDetail, loading, error, refetch: fetchKeyManagementData };
};

export default useFetchProgressKeyManagement;
