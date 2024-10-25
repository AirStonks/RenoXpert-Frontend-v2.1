// src/hooks/useFetchOwnerRegistrationForm.ts

import { useState, useEffect } from 'react';
import { fetchRegistrationForm } from '../services/ownerApi';
import { OwnerRegistrationForm } from '../types';

const useFetchOwnerRegistrationForm = (orderId: number | null) => {
    const [form, setForm] = useState<OwnerRegistrationForm | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (orderId === null) {
            setLoading(false); // No need to load if orderId is null
            setForm(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchRegistrationForm(orderId)
            .then((data) => {
                setForm(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch Form');
                setLoading(false);
            });
    }, [orderId]);

    return { form, loading, error };
};

export default useFetchOwnerRegistrationForm;
