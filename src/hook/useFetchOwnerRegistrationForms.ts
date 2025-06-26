// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { retrieveRegistrationForms } from '../services/ownerApi';
import { QuotationRequestForm } from '../types';

const useFetchOwnerRegistrationForms = () => {
    const [forms, setForms] = useState<QuotationRequestForm[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        retrieveRegistrationForms()
            .then((data) => {
                setForms(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch forms');
                setLoading(false);
            });
    }, []);

    return { forms, loading, error };
};

export default useFetchOwnerRegistrationForms;
