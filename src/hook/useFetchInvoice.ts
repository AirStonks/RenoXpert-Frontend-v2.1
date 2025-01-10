// src/hooks/useFetchProduct.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchInvoice } from '../services/api';
import { Invoice } from '../types';

const useFetchInvoice = (invoiceId: number | null) => {
    const [invoiceDetail, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoiceData = useCallback(() => {
        if (invoiceId === null) {
            setLoading(false); // No need to load if invoiceId is null
            setInvoice(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchInvoice(invoiceId)
            .then((data) => {
                setInvoice(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('An unexpected error occured');
                setLoading(false);
            });
    }, [invoiceId]);

    useEffect(() => {
        fetchInvoiceData();
    }, [invoiceId, fetchInvoiceData]);

    return { invoiceDetail, loading, error, refetch: fetchInvoiceData };
};

export default useFetchInvoice;
