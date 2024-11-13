import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' ? import.meta.env.VITE_API_URL_LOCAL : import.meta.env.VITE_API_URL_LN;

export const getProperties = async () => {
    try {
        const response = await axios.get(API_URL + 'properties');
        return response.data;
    } catch (error) {
        console.log(error);
    }
};