import { ProjectStatusHistory, ProjectStatusHistoryFilter, ProjectStatusHistoryResponse } from '../types';
import axios from 'axios';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const fetchProjectStatusHistory = async (
    page: number = 1,
    size: number = 10,
    filters: ProjectStatusHistoryFilter = {}
): Promise<ProjectStatusHistoryResponse> => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            ...Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    acc[key] = value.toString();
                }
                return acc;
            }, {} as Record<string, string>)
        });

        const response = await axios.get(`${API_URL}project-status-history?${params}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching project status history:', error);
        throw error;
    }
};

export const fetchProjectStatusHistoryByType = async (
    snapshotType: 'weekly' | 'monthly' | 'yearly' = 'weekly',
    filters: Omit<ProjectStatusHistoryFilter, 'snapshot_type'> = {}
): Promise<ProjectStatusHistory[]> => {
    try {
        const response = await fetchProjectStatusHistory(1, 1000, {
            ...filters,
            snapshot_type: snapshotType
        });
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching ${snapshotType} project status history:`, error);
        throw error;
    }
};

export const fetchProjectStatusHistoryByDateRange = async (
    startDate: string,
    endDate: string,
    snapshotType: 'weekly' | 'monthly' | 'yearly' = 'weekly'
): Promise<ProjectStatusHistory[]> => {
    try {
        const response = await fetchProjectStatusHistory(1, 1000, {
            snapshot_date_from: startDate,
            snapshot_date_to: endDate,
            ...(snapshotType && { snapshot_type: snapshotType })
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching project status history by date range:', error);
        throw error;
    }
};

export const fetchProjectStatusHistoryByProperty = async (
    propertyId: string,
    snapshotType: 'weekly' | 'monthly' | 'yearly' = 'weekly'
): Promise<ProjectStatusHistory[]> => {
    try {
        const response = await fetchProjectStatusHistory(1, 1000, {
            property_id: propertyId,
            ...(snapshotType && { snapshot_type: snapshotType })
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching project status history by property:', error);
        throw error;
    }
};

export const fetchProjectStatusHistoryByRenoProgress = async (
    renoProgressId: string,
    snapshotType: 'weekly' | 'monthly' | 'yearly' = 'weekly'
): Promise<ProjectStatusHistory[]> => {
    try {
        const response = await fetchProjectStatusHistory(1, 1000, {
            reno_progress_id: renoProgressId,
            ...(snapshotType && { snapshot_type: snapshotType })
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching project status history by reno progress:', error);
        throw error;
    }
};
