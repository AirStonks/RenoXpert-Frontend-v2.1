// src/hooks/useFetchOrder.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchOrder } from '../services/api';
import { Order } from '../types';

const useFetchOrder = (orderId: number | null) => {
    const [orderDetail, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderData = useCallback(() => {
        if (orderId === null) {
            setLoading(false); // No need to load if orderId is null
            setOrder(null);
            setError(null);
            return; // Exit early
        }

        setLoading(true);
        fetchOrder(orderId)
            .then((data) => {
                setOrder(data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch order');
                setLoading(false);
            });
    }, [orderId]);

    useEffect(() => {
        fetchOrderData();
    }, [orderId, fetchOrderData]);

    return { orderDetail, loading, error, refetch: fetchOrderData };
};

export default useFetchOrder;
