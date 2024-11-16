import axios from 'axios';

const API_URL = 'https://api.renoxpert.my/api/';

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