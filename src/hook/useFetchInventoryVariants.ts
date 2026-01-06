// src/hooks/useFetchInventoryVariants.ts

import { useState, useEffect, useCallback } from 'react';
import { inventoryVariantIndex } from '../services/api';
import { InventoryVariant } from '../types';
import { logError } from '../utils/errorHandling';

interface UseFetchInventoryVariantsReturn {
  variants: InventoryVariant[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
}

const useFetchInventoryVariants = (
  inventoryItemId?: number,
  size: number = 10,
  page: number = 1
): UseFetchInventoryVariantsReturn => {
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fetch variants function - memoized for refetch
  const fetchVariantsData = useCallback(() => {
    setLoading(true);
    setError(null);
    inventoryVariantIndex(size, page, undefined, inventoryItemId)
      .then((data) => {
        setVariants(data?.data || []);
        setTotalCount(data?.totalCount || 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        logError('fetching inventory variants', err);
        setError('Failed to fetch inventory variants');
        setLoading(false);
      });
  }, [inventoryItemId, size, page]);

  // Fetch on mount and when dependencies change - use memoized callback
  useEffect(() => {
    fetchVariantsData();
  }, [fetchVariantsData]);

  // Return the variants, loading, error, totalCount, and refetch function
  return { variants, loading, error, totalCount, refetch: fetchVariantsData };
};

export default useFetchInventoryVariants;


