// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchProduct } from '../services/api';
import { Product } from '../types';

const useFetchProduct = (id: number) => {
    const [product, setProduct] = useState<Product>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchProduct(id)
                .then((data) => {
                    setProduct(data.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to fetch product');
                    setLoading(false);
                });
        }
    }, [id]);

    return { product, loading, error };
};

export default useFetchProduct;
