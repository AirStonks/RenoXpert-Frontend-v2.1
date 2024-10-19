// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchOwnerOrders } from '../services/ownerApi';
import { Order } from '../types';

const useFetchOwnerOrders = () => {
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetchOwnerOrders()
            .then((data) => {
                setOrders(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch contact');
                setLoading(false);
            });
    }, []);

    return { orders, loading, error };
};

export default useFetchOwnerOrders;
