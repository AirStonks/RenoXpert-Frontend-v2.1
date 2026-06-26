import axios from 'axios';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production" ? import.meta.env.VITE_API_URL
    : import.meta.env.VITE_APP_ENV === "staging" ? import.meta.env.VITE_STAGING_API_URL
    : import.meta.env.VITE_APP_ENV === "local" ? import.meta.env.VITE_LOCAL_API_URL
    : null;

export const getAgentAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('a_token')}` });

export interface AgentUser { id: number; name: string; email: string; type: string; referral_code?: string; onboarded_at?: string | null; country_code?: string | null; phone_no?: string | null; }

export const agentGoogleLogin = async (credential: string): Promise<{ token: string; user: AgentUser; needs_onboarding: boolean }> => {
    const response = await axios.post(API_URL + 'agent/google-login', { credential });
    const data = response.data?.data ?? response.data;
    if (data?.token) localStorage.setItem('a_token', data.token);
    return data;
};

export const agentOnboarding = async (payload: { name?: string; country_code: string; phone_no: string; agree_terms: boolean }): Promise<AgentUser> => {
    const response = await axios.post(API_URL + 'agent/onboarding', payload, { headers: getAgentAuthHeaders() });
    return response.data?.data ?? response.data;
};

export const getAgentUser = async (): Promise<AgentUser> => {
    const response = await axios.get(API_URL + 'user', { headers: getAgentAuthHeaders() });
    return response.data?.data ?? response.data;
};

export const agentLogout = () => { localStorage.removeItem('a_token'); };

export interface AgentCampaign {
    id: number;
    title: string;
    slug: string;
    thumbnail?: { file_url?: string } | null;
    booking_amount?: number | null;
    start_date?: string | null;
    end_date?: string | null;
}

export const getAgentCampaigns = async (): Promise<AgentCampaign[]> => {
    const response = await axios.get(API_URL + 'agent/campaigns', { headers: getAgentAuthHeaders() });
    return response.data?.data ?? response.data ?? [];
};
