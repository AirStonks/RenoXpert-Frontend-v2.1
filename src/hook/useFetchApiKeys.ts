import { useState, useEffect } from 'react';
import { ApiKey } from '../types';
import { apiKeysIndex } from '../services/api';

interface UseFetchApiKeysReturn {
    apiKeys: ApiKey[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
    };
}

export const useFetchApiKeys = (
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    order?: string,
    field?: string
): UseFetchApiKeysReturn => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        pageSize: pageSize
    });

    const fetchApiKeys = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiKeysIndex(pageSize, page, searchTerm, order, field);
            
            if (response && response.data) {
                setApiKeys(response.data);
                setPagination({
                    currentPage: response.current_page || page,
                    totalPages: response.last_page || 0,
                    totalItems: response.total || 0,
                    pageSize: response.per_page || pageSize
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
            console.error('Error fetching API keys:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApiKeys();
    }, [page, pageSize, searchTerm, order, field]);

    return {
        apiKeys,
        loading,
        error,
        refetch: fetchApiKeys,
        pagination
    };
};
