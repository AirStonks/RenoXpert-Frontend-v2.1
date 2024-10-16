// src\services\ownerApi.ts

import axios, { AxiosError } from 'axios';
import { handleOwner401Error } from '../utils/error401';

const API_URL = 'https://api.renoxpert.my/api/';

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