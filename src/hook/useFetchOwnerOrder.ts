// src/hooks/useFetchOwnerOrder.ts

import { useState, useEffect } from 'react';
import { fetchOwnerOrder } from '../services/ownerApi';
import { Order } from '../types';

const useFetchOwnerOrder = (orderId: number | null) => {
    const [orderDetail, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (orderId === null) {
            setLoading(false); // No need to load if orderId is null
            setOrder(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchOwnerOrder(orderId)
            .then((data) => {
                setOrder(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch order');
                setLoading(false);
            });
    }, [orderId]);

    return { orderDetail, loading, error };
};

export default useFetchOwnerOrder;
