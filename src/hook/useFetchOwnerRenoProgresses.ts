// src/hooks/useFetchOwnerRenoProgresses.ts

import { useState, useEffect } from 'react';
import { retrieveRenoProgresses } from '../services/ownerApi';
import { RenoProgress } from '../types';

const useFetchOwnerRenoProgresses = () => {
    const [renoProgresses, setRenoProgresses] = useState<RenoProgress[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortController = new AbortController();

    useEffect(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const data = await retrieveRenoProgresses(abortController.signal);
                    setRenoProgresses(data.data);
                    setLoading(false);
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.log('Fetch aborted');
                    } else {
                        setError('Failed to fetch Reno Progresses');
                        setLoading(false);
                    }
                }
            };
    
            fetchData();
    
            return () => {
                abortController.abort();
            };
        }, []);
    
        return { renoProgresses, loading, error, abort: () => abortController.abort() };
};

export default useFetchOwnerRenoProgresses;