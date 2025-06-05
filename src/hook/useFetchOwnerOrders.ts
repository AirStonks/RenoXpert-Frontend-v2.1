// src/hooks/useFetchOwnerOrders.ts
import { useState, useEffect } from 'react';
import { fetchOwnerOrders } from '../services/ownerApi';
import { Order } from '../types';

const useFetchOwnerOrders = () => {
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortController = new AbortController();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await fetchOwnerOrders(abortController.signal);
                setOrders(data.data);
                setLoading(false);
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Fetch aborted');
                } else {
                    setError('Failed to fetch orders');
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            abortController.abort();
        };
    }, []);

    return { orders, loading, error, abort: () => abortController.abort() };
};

export default useFetchOwnerOrders;