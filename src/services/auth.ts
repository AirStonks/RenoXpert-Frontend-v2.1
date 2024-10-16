// src/services/auth.ts

import axios from 'axios';

const API_URL = 'https://api.renoxpert.my/api/';

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


export const logout = async () => {

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  console.log(token);
  
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