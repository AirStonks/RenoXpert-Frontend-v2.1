// src/hooks/useFetchInvestorInterest.ts

import { useState, useEffect } from 'react';
import { InvestorInterest } from '../types';
import { fetchInvestorInterest } from '../services/api';

const useFetchInvestorInterest = (formId: number | null) => {
    const [investorInterestDetail, setInvestorInterest] = useState<InvestorInterest | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortController = new AbortController();

    useEffect(() => {
        if (formId === null) {
            setLoading(false); // No need to load if formId is null
            setInvestorInterest(null);
            setError(null);
            return; // Exit early
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await fetchInvestorInterest(formId, abortController.signal);
                setInvestorInterest(data.data);
                setLoading(false);
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Fetch aborted');
                } else {
                    setError('Failed to fetch property');
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            abortController.abort();
        };

    }, [formId]);

    return { investorInterestDetail, loading, error, abort: () => abortController.abort() };
};

export default useFetchInvestorInterest;