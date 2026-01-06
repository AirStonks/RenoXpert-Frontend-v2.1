// src/hooks/useFetchInventoryVariant.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchInventoryVariant } from '../services/api';
import { InventoryVariant } from '../types';
import { logError } from '../utils/errorHandling';
import axios from 'axios';

const useFetchInventoryVariant = (variantId: number | null) => {
  const [variant, setVariant] = useState<InventoryVariant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch variant function - memoized for refetch
  const fetchVariantData = useCallback(() => {
    if (variantId) {
      setLoading(true);
      setError(null);
      fetchInventoryVariant(variantId)
        .then((data) => {
          if (data?.data) {
            setVariant(data.data);
          } else {
            // Handle case where response structure might be different
            setVariant(data as InventoryVariant);
          }
          setLoading(false);
        })
        .catch((err: unknown) => {
          logError('fetching inventory variant', err);
          // Provide user-friendly error message without exposing IDs
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
              setError('Item is not found');
            } else if (err.response?.data?.message) {
              setError(err.response.data.message);
            } else {
              setError('Failed to fetch variant');
            }
          } else if (err instanceof Error && err.message.includes('not found')) {
            setError('Item is not found');
          } else {
            setError('Failed to fetch variant');
          }
          setLoading(false);
        });
    } else {
      setVariant(null);
      setLoading(false);
    }
  }, [variantId]);

  // Fetch on mount and when variantId changes - use memoized callback
  useEffect(() => {
    fetchVariantData();
  }, [fetchVariantData]);

  // Return the variant, loading, error, and refetch function
  return { variant, loading, error, refetch: fetchVariantData };
};

export default useFetchInventoryVariant;


