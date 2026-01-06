// error401.ts

import { AxiosError } from 'axios';

export const handle401Error = (error: AxiosError): void => {
    if (error.response && error.response.status === 401) {
        window.location.href = window.location.hostname === 'localhost' ? '/staff/login' : '/login';
    } else {
        console.error('Error:', error);
        throw error;
    }
};

export const handleOwner401Error = (error: AxiosError): void => {
    if (error.response && error.response.status === 401) {
        window.location.href = (window.location.hostname === 'localhost' ? '/owner/' : '/') + 'login';
    } else if (error.code === 'ERR_CANCELED') {
        return;
    } else {
        console.error('Error:', error);
        throw error;
    }
};

export const handleOperation401Error = (error: AxiosError): void => {
    if (error.response && error.response.status === 401) {
        window.location.href = window.location.hostname === 'localhost' ? '/op/login' : '/login';
    } else {
        console.error('Error:', error);
        throw error;
    }
};