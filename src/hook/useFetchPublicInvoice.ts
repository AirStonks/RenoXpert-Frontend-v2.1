// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchPublicInvoice } from '../services/api';
import { Invoice } from '../types';

const useFetchPublicInvoice = (invoiceId: number | null) => {
    const [invoiceDetail, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (invoiceId === null) {
            setLoading(false); // No need to load if invoiceId is null
            setInvoice(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchPublicInvoice(invoiceId)
            .then((data) => {
                setInvoice(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('An unexpected error occured');
                setLoading(false);
            });
    }, [invoiceId]);

    return { invoiceDetail, loading, error };
};

export default useFetchPublicInvoice;
