// src\services\ownerApi.ts

import axios, { AxiosError } from 'axios';
import { handleOperation401Error } from '../utils/error401';

const API_URL = window.location.hostname === 'localhost' ? import.meta.env.VITE_API_URL_LOCAL : import.meta.env.VITE_API_URL_LN;

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

export const fetchQCForms = async () => {
    try {
        const response = await axios.get(API_URL + `reno/qc-forms`, {
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
        const response = await axios.get(API_URL + `reno/qc-forms/${formId}/fetch`, {
            headers: getAuthHeaders(),
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