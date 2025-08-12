import { useState, useEffect } from 'react';
import { user } from '../services/ownerApi';
import { User } from '../types';

export const useUser = () => {
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await user();
            setUserData(response);
        } catch (err) {
            console.error('Failed to load user data:', err);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    return {
        user: userData,
        loading,
        error,
        refetch: loadUser
    };
};
