// src\services\ownerApi.ts

import axios, { AxiosError } from 'axios';
import { handleOwner401Error } from '../utils/error401';
import { Order } from '../types';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

const getAuthHeaders = () => {
    const token = localStorage.getItem('o_token');
    return {
        Authorization: `Bearer ${token}`
    };
};

// export const user = async () => {
//     try {
//         const response = await axios.get(API_URL + 'owner/user', {
//             headers: getAuthHeaders()
//         });
//         return response.data;
//     } catch (error) {
//         handle401Error(error as AxiosError);
//     }
// };

export const user = async () => {
    try {
        const response = await axios.get(API_URL + 'user', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleOwner401Error(error as AxiosError);
    }
};

export const userDetail = async () => {
    try {
        const response = await axios.get(API_URL + 'user', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        return 'error';
    }
};

export const fetchExistsUser = async (country_code: string, phone_no: string) => {
    try {
        const response = await axios.get(API_URL + `owner/check/list/user/${country_code}/${phone_no}`);
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchOwnerOrder = async (orderId: number) => {
    try {
        const response = await axios.get(API_URL + `owner/order/${orderId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchOwnerOrders = async () => {
    try {
        const response = await axios.get(API_URL + `owner/orders`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('o_token')}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const updateOwnerOrderAddon = async (orderDetail: Order) => {
    try {
        const response = await axios.put(API_URL + `owner/orders/${orderDetail.id}/addon-packages/update`, orderDetail, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const toggleOwnerOrderAddon = async (order_id: number, package_id: number) => {
    try {
        const response = await axios.get(API_URL + `owner/orders/${order_id}/addon-packages/${package_id}/toggle`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchOwnerRenoProgresses = async () => {
    try {
        const response = await axios.get(API_URL + `owner/reno-progresses`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const submitRegistrationForm = async (formData: any) => {
    try {
        const response = await axios.post(API_URL + `owner/reno-registration-form/overview/submit`, formData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('o_token')}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const retrieveRegistrationForms = async () => {
    try {
        const response = await axios.get(API_URL + `owner/form/reno-registration-forms`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchRegistrationForm = async (formId: number) => {
    try {
        const response = await axios.get(API_URL + `owner/form/reno-registration-forms/${formId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const retrieveRenoProgresses = async () => {
    try {
        const response = await axios.get(API_URL + `owner/reno/progresses`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchRenoProgress = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `owner/reno/progresses/${renoProgressId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const retrieveRenoProgressPhaseAttachments = async (renoProgressId: number, phase: string) => {
    try {
        const response = await axios.get(API_URL + `owner/reno/progresses/${renoProgressId}/phase/${phase}/attachments`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const retrieveJobAttachments = async (renoProgressId: number, jobId: number) => {
    try {
        const response = await axios.get(API_URL + `owner/reno/progresses/${renoProgressId}/job/${jobId}/attachments`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOwner401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};