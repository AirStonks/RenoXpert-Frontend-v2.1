// src/services/auth.ts

import axios from 'axios';

const API_URL = 
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

export const userLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post(API_URL + 'login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token); // Store the token
      return response.data.data;
    }
  } catch (error) {
    console.error('Login error', error);
    throw error;
  }
};

export const operationLogin = async (mobile: string, password: string) => {
  try {
    const response = await axios.post(API_URL + 'operation/login', { mobile, password });
    if (response.data.success) {
      localStorage.setItem('p_token', response.data.data.token); // Store the token
      return response.data.data;
    }
  } catch (error) {
    console.error('Login error', error);
    throw error;
  }
}

export const logout = async () => {

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  try {
    // Make the request to the logout endpoint with the token
    const response = await axios.post(API_URL + 'logout', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Clear token from storage
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');

    // Return the data from the response
    return response.data;

  } catch (error) {
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};

export const logoutOwner = async () => {

  const token = localStorage.getItem('o_token') || sessionStorage.getItem('o_token');

  try {
    // Make the request to the logout endpoint with the token
    const response = await axios.post(API_URL + 'logout', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Clear token from storage
    localStorage.removeItem('o_token');
    sessionStorage.removeItem('o_token');

    // Return the data from the response
    return response.data;

  } catch (error) {
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};

export const logoutOperation = async () => {

  const token = localStorage.getItem('p_token') || sessionStorage.getItem('p_token');
  
  try {
    // Make the request to the logout endpoint with the token
    const response = await axios.post(API_URL + 'logout', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Clear token from storage
    localStorage.removeItem('p_token');
    sessionStorage.removeItem('p_token');

    // Return the data from the response
    return response.data;

  } catch (error) {
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};