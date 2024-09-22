// src\services\api.ts

import axios, { AxiosError } from 'axios';
import { handle401Error } from '../utils/error401'; // Adjust the import path as needed
import { Package, Product, ProductCategory, Quotation } from '../types';

const API_URL = 'http://' + window.location.hostname + ':8000/api/';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const user = async () => {
    try {
        const response = await axios.get(API_URL + 'user', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const fetchData = async () => {
    try {
        const response = await axios.get(API_URL + 'data', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const createProduct = async (productData: Product) => {
    try {
        const response = await axios.post(API_URL + 'products', productData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};


export const updateProduct = async (productData: Product) => {
    try {
        const response = await axios.put(API_URL + `products/${productData.id}`, productData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const fetchProduct = async (productId: number) => {
    try {
        const response = await axios.get(API_URL + `products/${productId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const removeProduct = async (productId: number) => {
    try {
        const response = await axios.delete(API_URL + `products/${productId}`, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchProductCategory = async () => {
    try {
        const response = await axios.get(API_URL + 'product/category', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const addProductCategory = async (categoryData: ProductCategory) => {
    console.log('lol');
    
    try {
        const response = await axios.post(API_URL + 'product/category', categoryData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const removeProductCategory = async (productCategoryId: number) => {
    try {
        const response = await axios.delete(API_URL + `product/category/${productCategoryId}`, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const createPackage = async (packageData: Package) => {
    try {
        const response = await axios.post(API_URL + 'packages', packageData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const fetchPackages = async () => {
    try {
        const response = await axios.get(API_URL + 'packages', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const fetchPackage = async (packageId: number) => {
    try {
        const response = await axios.get(API_URL + `packages/${packageId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const updatePackage = async (packageData: Product) => {
    try {
        const response = await axios.put(API_URL + `packages/${packageData.id}`, packageData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const removePackage = async (packageId: number) => {
    try {
        const response = await axios.delete(API_URL + `packages/${packageId}`, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}


export const createQuotation = async (quotationData: Quotation) => {
    try {
        const response = await axios.post(API_URL + 'quotations', quotationData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};


export const fetchQuotation = async (quotationId: number) => {
    try {
        const response = await axios.get(API_URL + `quotations/${quotationId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};