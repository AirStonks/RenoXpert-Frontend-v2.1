// src\services\ownerApi.ts

import axios, { AxiosError } from 'axios';
import { handleOperation401Error } from '../utils/error401';
import { QCForm } from '../types';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

const getAuthHeaders = () => {
    const token = localStorage.getItem('p_token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const user = async () => {
    try {
        const response = await axios.get(API_URL + 'user', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleOperation401Error(error as AxiosError);
    }
};

export const fetchProperties = async () => {
    try {
        const response = await axios.get(API_URL + `op/properties`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const retrieveRenoProgresses = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + `op/reno/progresses`, {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchRenoProgressDetail = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `op/reno/progress/${renoProgressId}`, {
            headers: getAuthHeaders(),
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchDIForms = async () => {
    try {
        const response = await axios.get(API_URL + `op/reno/defect-inspection-forms`, {
            headers: getAuthHeaders(),
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchDIForm = async (formId: number) => {
    try {
        const response = await axios.get(API_URL + `op/reno/defect-inspection-forms/${formId}/fetch`, {
            headers: getAuthHeaders(),
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const liveUpdateDIForm = async (formId: number, formData) => {
    try {
        const response = await axios.post(API_URL + `op/reno/defect-inspection-forms/${formId}/save`, formData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('p_token')}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const removeDIFormAttachment = async (formId: number, formData) => {
    try {
        // op/reno/defect-inspection-forms/{id}/attachment/remove
        const response = await axios.post(API_URL + `op/reno/defect-inspection-forms/${formId}/attachment/remove`, formData, {
            headers: getAuthHeaders(),
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const submitDIForm = async (formId: number) => {
    try {
        const response = await axios.get(API_URL + `op/reno/defect-inspection-form/${formId}/submit`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('p_token')}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchQCForms = async () => {
    try {
        const response = await axios.get(API_URL + `op/reno/qc-forms`, {
            headers: getAuthHeaders(),
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchQCForm = async (formId: number) => {
    try {
        const response = await axios.get(API_URL + `op/reno/qc-forms/${formId}/fetch`, {
            headers: getAuthHeaders(),
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const submitQCForm = async (formData: QCForm) => {
    try {
        const response = await axios.post(API_URL + `op/reno/qc-form/submit`, formData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('p_token')}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

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

export const fetchExistsUser = async (phone_no: string) => {
    try {
        const response = await axios.get(API_URL + `owner/check/list/user/${phone_no}`);
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const submitRegistrationForm = async (formData) => {
    try {
        const response = await axios.post(API_URL + `owner/reno-registration-form/overview/submit`, formData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('o_token')}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchTaskDocuments = async (renoProgressId: number, taskId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/documents/fetch`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const uploadTaskDocuments = async (renoProgressId: number, taskId: number, files: File[]) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append each file to the FormData object
        files.forEach(file => {
            formData.append('attachments[]', file);  // 'attachments[]' because your backend expects an array
        });

        // Make the API request
        const response = await axios.post(
            `${API_URL}reno-progress/${renoProgressId}/task/${taskId}/documents/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handleOperation401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
};

export const removeTaskDocument = async (renoProgressId: number, taskId: number, documentIndex: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/documents/${documentIndex}/remove`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const updateSelectedTaskComments = async (renoProgressId: number, taskId: number, owner_comment: string, internal_comment: string) => {
    try {
        const response = await axios.post(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/comments`, {
            owner_comment: owner_comment,
            internal_comment: internal_comment,
        }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const changeTaskStatus = async (renoProgressId: number, taskId: number, status: string) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/status/${status}`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handleOperation401Error(error as AxiosError);
        throw error;
    }
}