import { useEffect, useState } from "react";
import { RenoXSale } from "../types";
import { fetchRenoSale } from "../services/api";

const useFetchRenoSale = (renoSaleId: number | null) => {
    const [renoSaleDetail, setRenoSale] = useState<RenoXSale | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortController = new AbortController();

    useEffect(() => {
        if (renoSaleId === null) {
            setLoading(false); // No need to load if renoSaleId is null
            setRenoSale(null);
            setError(null);
            return; // Exit early
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await fetchRenoSale(renoSaleId, abortController.signal);
                setRenoSale(data.data);
                setLoading(false);
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Fetch aborted');
                } else {
                    setError('Failed to fetch property');
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            abortController.abort();
        };

    }, [renoSaleId]);

    return { renoSaleDetail, loading, error, abort: () => abortController.abort() };
};

export default useFetchRenoSale;