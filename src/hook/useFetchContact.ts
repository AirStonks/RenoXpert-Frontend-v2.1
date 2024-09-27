// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchContact } from '../services/api';
import { Contact } from '../types';

const useFetchContact = (contactId: number | null) => {
    const [contactDetail, setProduct] = useState<Contact | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (contactId === null) {
            setLoading(false); // No need to load if contactId is null
            setProduct(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchContact(contactId)
            .then((data) => {
                setProduct(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch contact');
                setLoading(false);
            });
    }, [contactId]);

    return { contactDetail, loading, error };
};

export default useFetchContact;
