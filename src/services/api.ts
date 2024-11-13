// src\services\api.ts

import axios, { AxiosError } from 'axios';
import { handle401Error } from '../utils/error401'; // Adjust the import path as needed
import { DiscountFee, Invoice, Order, OwnerRegistrationForm, Package, PMCategory, Product, Property, QCForm, Quotation, Sale, User } from '../types';

const API_URL = window.location.hostname === 'localhost' ? import.meta.env.VITE_API_URL_LOCAL : import.meta.env.VITE_API_URL_LN;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const testGenerateProgress = async () => {
    try {
        const response = await axios.get(API_URL + 'tmp/progress/generate', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
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

export const changePassword = async (formData) => {
    try {
        const response = await axios.post(API_URL + 'change-password', formData, {
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

export const fetchUser = async (userId: number) => {
    try {
        const response = await axios.get(API_URL + `users/${userId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchUsers = async (searchTerm = '', userType: string = null) => {
    try {
        if (userType) {
            const response = await axios.get(API_URL + 'users/type/' + userType, {
                headers: getAuthHeaders(),
                params: {
                    search: searchTerm,
                }
            });

            return response.data;
        }

        const response = await axios.get(API_URL + 'users', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const addUser = async (userData: User) => {
    try {
        const response = await axios.post(API_URL + 'users', userData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

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

export const fetchProducts = async () => {
    try {
        const response = await axios.get(API_URL + 'products', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
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

export const fetchPMCategory = async (length = 5) => {
    try {
        const response = await axios.get(API_URL + 'product/category', {
            headers: getAuthHeaders(),
            params: {
                size: length
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const addPMCategory = async (categoryData: PMCategory) => {
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
            headers: getAuthHeaders(),
            params: {
                size: 150
            }
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

export const updateQuotation = async (quotationData: Quotation) => {
    try {
        const response = await axios.put(API_URL + `quotations/${quotationData.id}`, quotationData, {
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

export const fetchQuotations = async (searchTerm = '', length = 5) => {
    try {
        const response = await axios.get(API_URL + `quotations`, {
            headers: getAuthHeaders(),
            params: {
                search: searchTerm,
                size: length
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const removeQuotation = async (quotationId: number) => {
    try {
        const response = await axios.delete(API_URL + `quotations/${quotationId}`, {
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

export const createProperty = async (propertyData: Property) => {
    try {
        const response = await axios.post(API_URL + 'properties', propertyData, {
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

export const fetchProperty = async (propertyId: number) => {
    try {
        const response = await axios.get(API_URL + `properties/${propertyId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchProperties = async (searchTerm = '', length = 5) => {
    try {
        const response = await axios.get(API_URL + `properties`, {
            headers: getAuthHeaders(),
            params: {
                search: searchTerm,
                size: length
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const updateProperty = async (propertyData: Property) => {
    try {
        const response = await axios.put(API_URL + `properties/${propertyData.id}`, propertyData, {
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

export const removeProperty = async (propertyId: number) => {
    try {
        const response = await axios.delete(API_URL + `properties/${propertyId}`, {
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

export const createOrder = async (orderData: Order) => {
    try {
        const response = await axios.post(API_URL + 'orders', orderData, {
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

export const fetchOrder = async (orderId: number) => {
    try {
        const response = await axios.get(API_URL + `orders/${orderId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchOrders = async (searchTerm = '', length = 5) => {
    try {
        const response = await axios.get(API_URL + `orders`, {
            headers: getAuthHeaders(),
            params: {
                search: searchTerm,
                size: length
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const updateOrder = async (orderData: Order) => {
    try {
        const response = await axios.put(API_URL + `orders/${orderData.id}`, orderData, {
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

export const removeOrder = async (orderId: number) => {
    try {
        const response = await axios.delete(API_URL + `orders/${orderId}`, {
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

export const confirmOrder = async (orderId: number) => {
    try {
        const response = await axios.get(API_URL + `orders/${orderId}/confirm`, {
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

export const fetchSale = async (saleId: number) => {
    try {
        const response = await axios.get(API_URL + `sales/${saleId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const updateSale = async (saleData: Sale) => {
    try {
        const response = await axios.put(API_URL + `sales/${saleData.id}`, saleData, {
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

export const createDiscountFee = async (discountFeeData: DiscountFee) => {
    try {
        const response = await axios.post(API_URL + 'discountFees', discountFeeData, {
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

export const fetchDiscountFee = async (discountFeeId: number) => {
    try {
        const response = await axios.get(API_URL + `discountFees/${discountFeeId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchDiscountFees = async (searchTerm = '', length = 5, type = 'fee') => {
    try {
        const response = await axios.get(API_URL + 'discountFees', {
            headers: getAuthHeaders(),
            params: {
                search: searchTerm,
                size: length,
                type: type
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const updateDiscountFee = async (discountFeeData: DiscountFee) => {
    try {
        const response = await axios.put(API_URL + `discountFees/${discountFeeData.id}`, discountFeeData, {
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

export const removeDiscountFee = async (discountFeeId: number) => {
    try {
        const response = await axios.delete(API_URL + `discountFees/${discountFeeId}`, {
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

export const createInvoice = async (invoiceData: Invoice) => {
    try {
        const response = await axios.post(API_URL + 'invoices', invoiceData, {
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

export const fetchInvoice = async (invoiceId: number) => {
    try {
        const response = await axios.get(API_URL + `invoices/${invoiceId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const fetchPublicInvoice = async (invoiceId: number) => {
    try {
        const response = await axios.get(API_URL + `invoices/public/view/${invoiceId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const changeInvoiceLinkStatus = async (invoiceId: number, status: string) => {
    try {
        const response = await axios.put(API_URL + `invoices/${invoiceId}/link/status/${status}`, {}, {
            headers: getAuthHeaders(),
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }

};


export const makePaymentIntent = async (invoiceId: number) => {
    try {
        const response = await axios.get(API_URL + `payex/paymentIntent/invoice/${invoiceId}`);
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}


export const testSms = async () => {
    try {
        const response = await axios.get('https://www.isms.com.my/isms_send_all_id.php?un=roomzasia&pwd=FGk@A2kwuUewkYu&dstno=601136647745&msg=Hello%20World&type=1&sendid=601118882881&agreedterm=YES');

        return response;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}


export const fetchRegistrationForm = async (formId: number, originalForm: boolean = false) => {
    try {
        const response = await axios.get(API_URL + `owner/reno-registration-form/${formId}?originalForm=${originalForm}`, {
            headers: getAuthHeaders()
        });

        return response;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const approveRegistrationForm = async (formId: number) => {
    try {
        const response = await axios.get(API_URL + `owner/reno-registration-form/${formId}/status/approve`, {
            headers: getAuthHeaders()
        });

        return response;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}


export const rejectRegistrationForm = async (formId: number) => {
    try {
        const response = await axios.get(API_URL + `owner/reno-registration-form/${formId}/status/reject`, {
            headers: getAuthHeaders()
        });

        return response;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const updateRegistrationForm = async (form: OwnerRegistrationForm) => {
    try {
        const response = await axios.put(API_URL + `owner/reno-registration-form/${form.id}`, form, {
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

export const fetchRenoProgress = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const toggleTaskSupply = async (renoProgressId: number, taskId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/supply/toggle`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const toggleTaskInstall = async (renoProgressId: number, taskId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/install/toggle`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}