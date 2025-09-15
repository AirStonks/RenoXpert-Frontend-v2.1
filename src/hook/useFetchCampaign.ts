import { useState, useEffect } from 'react';
import { Campaign } from '../types';
import { campaignDetail } from '../services/api';

interface UseFetchCampaignReturn {
    campaign: Campaign | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export default function useFetchCampaign(campaignId: string | number | null): UseFetchCampaignReturn {
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCampaign = async () => {
        if (!campaignId) {
            setCampaign(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await campaignDetail(campaignId);
            setCampaign(response.data);
        } catch (err) {
            console.error('Error fetching campaign:', err);
            setError('Failed to load campaign details');
            setCampaign(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaign();
    }, [campaignId]);

    const refetch = async () => {
        await fetchCampaign();
    };

    return {
        campaign,
        loading,
        error,
        refetch
    };
}
