// src/hooks/useFetchInventory.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchInventory } from '../services/api';
import { Inventory } from '../types';
import { logError } from '../utils/errorHandling';

const useFetchInventory = (id: number | null) => {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inventory function - memoized for refetch
  const fetchInventoryData = useCallback(() => {
    if (id) {
      setLoading(true);
      setError(null);
      fetchInventory(id)
        .then((data) => {
          setInventory(data.data);
          setLoading(false);
        })
        .catch((err: unknown) => {
          logError('fetching inventory', err);
          setError('Failed to fetch inventory');
          setLoading(false);
        });
    } else {
      setInventory(null);
      setLoading(false);
    }
  }, [id]);

  // Fetch on mount and when id changes - use memoized callback
  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Return the inventory, loading, error, and refetch function
  return { inventory, loading, error, refetch: fetchInventoryData };
};

export default useFetchInventory;


