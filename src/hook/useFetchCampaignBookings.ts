import { useState, useEffect } from 'react';
import { getCampaignBookings } from '../services/api';
import { Booking } from '../types';

export default function useFetchCampaignBookings(campaignId: number | null) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = async () => {
        if (!campaignId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const data = await getCampaignBookings(campaignId);
            setBookings(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [campaignId]);

    const refetch = () => {
        fetchBookings();
    };

    return {
        bookings,
        loading,
        error,
        refetch
    };
}
