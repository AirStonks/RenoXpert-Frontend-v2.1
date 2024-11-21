import axios from 'axios';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

export const getOwnerUser = async () => {
    try {
        const token = localStorage.getItem('o_token');

        const response = await axios.get(API_URL + 'user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;

    } catch (error) {
        if (error.status === 401) {
            return {
                status: 401,
                message: 'Unauthorized',
            }
        }
    }
};


export const getProperties = async () => {
    try {
        const response = await axios.get(API_URL + 'public/properties');
        return response.data;
    } catch (error) {
        console.log(error);
    }
};