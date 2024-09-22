// error401.ts

import { AxiosError } from 'axios';

export const handle401Error = (error: AxiosError): void => {
    if (error.response && error.response.status === 401) {
        // Redirect to login page if error status is 401
        window.location.href = '/login';
    } else {
        console.error('Error:', error);
        throw error; // Rethrow the error for further handling
    }
};
