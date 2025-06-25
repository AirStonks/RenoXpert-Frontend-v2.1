// src/hooks/useFetchRegistrationForm.ts

import { useState, useEffect } from 'react';
import { fetchRegistrationForm } from '../services/api';
import { QuotationRequestForm } from '../types';

const useFetchRegistrationForm = (formId: number | null, originalForm: boolean = false) => {
    const [formDetail, setFormDetail] = useState<QuotationRequestForm | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (formId === null) {
            setLoading(false); // No need to load if formId is null
            setFormDetail(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchRegistrationForm(formId, originalForm)
            .then((data) => {
                setFormDetail(data.data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('An unexpected error occured');
                setLoading(false);
            });
    }, [formId]);

    return { formDetail, loading, error };
};

export default useFetchRegistrationForm;
