// src/hooks/useFetchKeyManagement.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchProgressKeyManagement } from '../services/api';
import { KeyManagement } from '../types';

const useFetchKeyManagement = (keyManagementId: number | null) => {
    const [keyManagementDetail, setKeyManagement] = useState<KeyManagement | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchKeyManagementData = useCallback(() => {
        if (keyManagementId === null) {
            setLoading(false); // No need to load if keyManagementId is null
            setKeyManagement(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchProgressKeyManagement(keyManagementId)
            .then((data) => {
                setKeyManagement(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch key management');
                setLoading(false);
            });
    }, [keyManagementId]);

    useEffect(() => {
        fetchKeyManagementData();
    }, [keyManagementId, fetchKeyManagementData]);

    return { keyManagementDetail, loading, error, refetch: fetchKeyManagementData };
};

export default useFetchKeyManagement;
