// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchUser } from '../services/api';
import { User } from '../types';

const useFetchUser = (saleId: number | null) => {
    const [userDetail, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (saleId === null) {
            setLoading(false);
            setUser(null);
            setError(null);
            return;
        }

        setLoading(true);
        fetchUser(saleId)
            .then((data) => {
                setUser(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('An unexpected error occured');
                setLoading(false);
            });
    }, [saleId]);

    return { userDetail, loading, error };
};

export default useFetchUser;
