// src/hooks/useFetchProduct.ts

import { useState, useEffect } from 'react';
import { fetchProductCategory } from '../services/api';
import { ProductCategory } from '../types';

const useFetchProductCategory = () => {
    const [productCategory, setProductCategory] = useState<ProductCategory[]>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            setLoading(true);
            fetchProductCategory()
                .then((data) => {
                    setProductCategory(data.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to fetch product category');
                    setLoading(false);
                });
        };

        fetchCategory();
    }, []);

    return { productCategory, loading, error };
};

export default useFetchProductCategory;
