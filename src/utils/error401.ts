// error401.ts

import { AxiosError } from 'axios';

export const handle401Error = (error: AxiosError): void => {
    if (error.response && error.response.status === 401) {
        // Redirect to login page if error status is 401
        window.location.href = window.location.hostname === 'localhost' ? '/staff/' : '/' + 'login';
    } else {
        console.error('Error:', error);
        throw error; // Rethrow the error for further handling
    }
};

export const handleOwner401Error = (error: AxiosError): void => {
    if (error.response && error.response.status === 401) {
        // Redirect to login page if error status is 401
        window.location.href = (window.location.hostname === 'localhost' ? '/owner/' : '/') + 'login';
    } else if (error.code === 'ERR_CANCELED') {
        // Do nothing
    } else {
        console.error('Error:', error);
        throw error; // Rethrow the error for further handling
    }
};

export const handleOperation401Error = (error: AxiosError): void => {
    if (error.response && error.response.status === 401) {
        // Redirect to login page if error status is 401
        window.location.href = window.location.hostname === 'localhost' ? '/op/' : '/' + 'login';
    } else {
        console.error('Error:', error);
        throw error; // Rethrow the error for further handling
    }
};