// src/hooks/useFetchProduct.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchProduct } from '../services/api';
import { Product } from '../types';

const useFetchProduct = (id: number) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product function
  const fetchProductData = useCallback(() => {
    if (id) {
      setLoading(true);
      setError(null); // Reset error before fetching
      fetchProduct(id)
        .then((data) => {
          setProduct(data.data);
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to fetch product');
          setLoading(false);
        });
    }
  }, [id]);

  // Call the fetchProductData function on mount and whenever id changes
  useEffect(() => {
    fetchProductData();
  }, [id, fetchProductData]);

  // Return the product, loading, error, and refetch function
  return { product, loading, error, refetch: fetchProductData };
};

export default useFetchProduct;
