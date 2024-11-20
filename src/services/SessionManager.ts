// src/services/SessionManager.ts

import axios from 'axios';

const API_URL = 'https://sapi.renoxpert.my/api/';

export class SessionManager {
    static async checkSession(mobile: string, orderId: string): Promise<boolean> {
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) return false;

        try {
            const response = await axios.post(`${API_URL}/session/check`, {
                mobile,
                order_id: orderId,
                session_token: sessionToken
            });
            return response.data.valid;
        } catch (error) {
            console.error('Session check failed:', error);
            return false;
        }
    }

    static setSessionToken(token: string) {
        localStorage.setItem('sessionToken', token);
    }

    static clearSessionToken() {
        localStorage.removeItem('sessionToken');
    }
}