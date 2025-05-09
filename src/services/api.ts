// src\services\api.ts

import axios, { AxiosError } from 'axios';
import { handle401Error } from '../utils/error401'; // Adjust the import path as needed
import { DiscountFee, Invoice, KeyManagement, Order, OwnerRegistrationForm, Package, Payment, PMCategory, Product, Property, PurchaseOrder, QCForm, Quotation, Sale, User } from '../types';
import exp from 'constants';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

interface FilterParams {
    [key: string]: string | undefined;
}


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

export const changePassword = async (formData: any) => {
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

export const userIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'users', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
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

export const resetUserPassword = async (userId: number) => {
    try {
        const response = await axios.get(API_URL + `users/${userId}/password/reset`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const deactivateUser = async (userId: number) => {
    try {
        const response = await axios.get(API_URL + `users/${userId}/deactivate`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const permissionIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'permissions', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

export const addUserItemPermission = async (userId: number, permissionId: number = 1, itemId: number) => {
    try {
        const response = await axios.post(API_URL + `resource-items/add/user/permission`, {
            user_id: userId,
            permission_id: permissionId,
            item_id: itemId
        }, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }

}

export const changeRenoProgressGeneralPermission = async (renoProgressId: number, permissionId: number) => {
    try {
        const response = await axios.post(API_URL + `reno-progress/${renoProgressId}/general-permission`, {
            permission_id: permissionId
        }, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const changeUserItemPermission = async (userId: number, itemId: number, permissionId: number) => {
    try {
        const response = await axios.post(API_URL + `resource-items/${userId}/${itemId}/permission`, {
            permission_id: permissionId
        }, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const removeUserItemPermission = async (userId: number, itemId: number) => {
    try {
        const response = await axios.delete(API_URL + `resource-items/${userId}/${itemId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
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

export const fetchContacts = async () => {
    try {
        const response = await axios.get(API_URL + 'contacts', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

export const fetchContact = async (contactId: number) => {
    try {
        const response = await axios.get(API_URL + `contacts/${contactId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

export const productIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'products', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const productIndexArchived = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'products/index/archived', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
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
                'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
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

export const changeProductThumbnail = async (productId: number, file: File) => {
    try {
        const formData = new FormData();

        formData.append('attachment', file);

        const response = await axios.post(
            `${API_URL}products/${productId}/attachments/thumbnail/change`, formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
}

export const uploadProductPhotos = async (productId: number, files: File[]) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append each file to the FormData object
        files.forEach(file => {
            formData.append('attachments[]', file);  // 'attachments[]' because your backend expects an array
        });

        // Make the API request
        const response = await axios.post(
            `${API_URL}products/${productId}/attachments/photos/upload`, formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
};

export const removeProductPhoto = async (productId: number, photoIndex: number) => {
    try {
        const response = await axios.get(API_URL + `products/${productId}/attachments/photos/${photoIndex}/remove`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const archiveProduct = async (productId: number) => {
    try {
        const response = await axios.get(API_URL + `products/${productId}/archive`, {
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

export const restoreProduct = async (productId: number) => {
    try {
        const response = await axios.get(API_URL + `products/${productId}/restore`, {
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

export const packageIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, isHead: boolean = true) => {
    try {
        const response = await axios.get(API_URL + 'packages', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                head: isHead
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const packageIndexArchived = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'packages/index/archived', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

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

export const updatePackage = async (packageData: Package) => {
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

export const archivePackage = async (packageId: number) => {
    try {
        const response = await axios.get(API_URL + `packages/${packageId}/archive`, {
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

export const restorePackage = async (packageId: number) => {
    try {
        const response = await axios.get(API_URL + `packages/${packageId}/restore`, {
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

export const quotationIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, isHead: boolean = true) => {
    try {
        const response = await axios.get(API_URL + 'quotations', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                head: isHead,
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const quotationIndexArchived = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'quotations/index/archived', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const createQuotation = async (quotationData: Quotation, selectedPackages: any) => {
    try {
        const dataToSend = {
            ...quotationData,
            selectedPackages
        };

        const response = await axios.post(API_URL + 'quotations', dataToSend, {
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

export const archiveQuotation = async (quotationId: number) => {
    try {
        const response = await axios.get(API_URL + `quotations/${quotationId}/archive`, {
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

export const restoreQuotation = async (quotationId: number) => {
    try {
        const response = await axios.get(API_URL + `quotations/${quotationId}/restore`, {
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

export const propertyIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'properties', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

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

export const fetchProperties = async (searchTerm = '', length = 50) => {
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

export const orderIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, filter?: string, isHead: boolean = true) => {
    try {
        const response = await axios.get(API_URL + 'orders', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                filter: filter,
                head: isHead,
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

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

export const releaseOrder = async (orderId: number) => {
    try {
        const response = await axios.get(API_URL + `orders/${orderId}/release`, {
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

export const reReleaseOrder = async (orderId: number) => {
    try {
        const response = await axios.get(API_URL + `orders/${orderId}/re-release`, {
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

export const updateOrderInternalRemark = async (orderId: number, internal_remark: string) => {
    try {
        const data = {
            internal_remark
        }

        const response = await axios.post(API_URL + `orders/${orderId}/internal-remark/update`, data, {
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

export const salesIndex = async (
    size: number = 5,
    page: number = 1,
    searchTerm?: string,
    order?: string,
    field?: string,
    filters: FilterParams = {},
    isHead: boolean = true
) => {
    try {
        const params: any = {
            size: size,
            page: page,
            search: searchTerm,
            sortOrder: order,
            sortField: field,
            head: isHead,
        };

        if (Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params[`filter[${key}]`] = value;
                }
            });
        }

        const response = await axios.get(API_URL + 'sales', {
            headers: getAuthHeaders(),
            params: params
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

export const fetchSales = async (searchTerm = '', length = 5) => {
    try {
        const response = await axios.get(API_URL + `sales`, {
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

export const discountFeeIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'discountFees', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
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

export const markInvoiceAsPaid = async (invoiceId: number) => {
    try {
        const response = await axios.put(API_URL + `invoices/${invoiceId}/paid`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

export const saveInvoiceDetail = async (invoiceId: number, paymentDetail: Payment, attachments: File[]) => {
    try {

        const formData = new FormData();
        
        formData.append('invoice_id', String(invoiceId));
        formData.append('transaction_no', String(paymentDetail.transaction_no));
        formData.append('amount', String(paymentDetail.amount));
        formData.append('payment_method', String(paymentDetail.payment_method));
        formData.append('payment_channel', String(paymentDetail.payment_channel));
        formData.append('payment_date', String(paymentDetail.payment_date));
        formData.append('bank', String(paymentDetail.bank));
        formData.append('receiving_account', String(paymentDetail.receiving_account));
        formData.append('remark', String(paymentDetail.remark));

        attachments.forEach(file => {
            formData.append('attachments[]', file as File);  // 'attachments[]' because your backend expects an array
        });

        const response = await axios.post(API_URL + `invoices/${invoiceId}/payment/save`, paymentDetail, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

export const removeInvoice = async (invoiceId: number) => {
    try {
        const response = await axios.delete(API_URL + `invoices/${invoiceId}`, {
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

export const fetchInvoicePayment = async (invoiceId: number, paymentId: number) => {
    try {
        const response = await axios.get(API_URL + `invoices/${invoiceId}/payments/${paymentId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
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

export const registrationFormIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'owner/reno-registration-form', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

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

export const changeTaskStatus = async (renoProgressId: number, taskId: number, status: string) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/status/${status}`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const changeOwnerComment = async (renoProgressId: number, taskId: number, comment: string) => {
    try {
        const response = await axios.post(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/owner-comment/change`, { owner_comment: comment }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const changeInternalComment = async (renoProgressId: number, taskId: number, comment: string) => {
    try {
        const response = await axios.post(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/internal-comment/change`, { internal_comment: comment }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const toggleTaskVisibility = async (renoProgressId: number, taskId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/visibility/toggle`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const liveUploadTaskAttachment = async (renoProgressId: number, taskId: number, file: File) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append file to the FormData object
        formData.append('attachment', file);

        // Make the API request
        const response = await axios.post(
            `${API_URL}reno-progress/${renoProgressId}/task/${taskId}/document/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
}

export const uploadTaskDocuments = async (renoProgressId: number, taskId: number, files: File[]) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append each file to the FormData object
        files.forEach(file => {
            formData.append('attachments[]', file);  // 'attachments[]' because your backend expects an array
        });

        // Make the API request
        const response = await axios.post(
            `${API_URL}reno-progress/${renoProgressId}/task/${taskId}/documents/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
};

export const uploadTaskExternalDocuments = async (renoProgressId: number, taskId: number, files: File[]) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append each file to the FormData object
        files.forEach(file => {
            formData.append('external_attachment[]', file);  // 'attachments[]' because your backend expects an array
        });

        // Make the API request
        const response = await axios.post(
            `${API_URL}reno-progress/${renoProgressId}/task/${taskId}/documents/external/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
};

export const fetchTaskDocuments = async (renoProgressId: number, taskId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/documents/fetch`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const removeTaskDocument = async (renoProgressId: number, taskId: number, documentIndex: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/documents/${documentIndex}/remove`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const removeExternalTaskDocument = async (renoProgressId: number, taskId: number, documentIndex: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/task/${taskId}/documents/external/${documentIndex}/remove`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const changeRPMTaskStatus = async (rpmTaskId: number, status: string) => {
    try {
        const response = await axios.get(API_URL + `rpm-task/${rpmTaskId}/status/${status}`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const updateRPMInternalComment = async (rpmTaskId: number, comment: string) => {
    try {
        const response = await axios.put(API_URL + `rpm-task/${rpmTaskId}/comment/internal`, { internal_comment: comment }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const updateRPMExternalComment = async (rpmTaskId: number, comment: string) => {
    try {
        const response = await axios.put(API_URL + `rpm-task/${rpmTaskId}/comment/external`, { owner_comment: comment }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const uploadRPMInternalAttachment = async (rpmTaskId: number, files: File[]) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append each file to the FormData object
        files.forEach(file => {
            formData.append('internal_attachments[]', file);  // 'attachments[]' because your backend expects an array
        });

        // Make the API request
        const response = await axios.post(API_URL + `rpm-task/${rpmTaskId}/attachment/internal/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
}

export const uploadRPMExternalAttachment = async (rpmTaskId: number, files: File[]) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append each file to the FormData object
        files.forEach(file => {
            formData.append('owner_attachments[]', file);  // 'attachments[]' because your backend expects an array
        });

        // Make the API request
        const response = await axios.post(API_URL + `rpm-task/${rpmTaskId}/attachment/external/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
}

export const removeRPMInternalAttachment = async (rpmTaskId: number, attachmentIndex: number) => {
    try {
        const response = await axios.get(API_URL + `rpm-task/${rpmTaskId}/attachment/internal/${attachmentIndex}/remove`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const removeRPMExternalAttachment = async (rpmTaskId: number, attachmentIndex: number) => {
    try {
        const response = await axios.get(API_URL + `rpm-task/${rpmTaskId}/attachment/external/${attachmentIndex}/remove`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const renoProgressIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, isHead: boolean = true) => {
    try {
        const response = await axios.get(API_URL + 'reno-progress', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                head: isHead,
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const renoProgressAdvanceTable = async (groubBy?: string, groupOp?: string, groupValue?: string, filterBy?: string, filterOp?: string, filterValue?: string) => {
    try {
        const response = await axios.get(API_URL + 'reno-progress/table/advance', {
            headers: getAuthHeaders(),
            params: {
                groubBy: groubBy,
                groupOp: groupOp,
                groupValue: groupValue,
                filterBy: filterBy,
                filterOp: filterOp,
                filterValue: filterValue
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

export const changeRenoProgressContractualDate = async (renoProgressId: number, dateType: string, startDate?: string, endDate?: string) => {
    try {
        // Determine which field to update
        const payload: { start_date?: string; end_date?: string } = {};

        if (startDate) {
            payload.start_date = startDate;
        } else if (endDate) {
            payload.end_date = endDate;
        }

        // Proceed if either startDate or endDate is provided
        if (Object.keys(payload).length === 0) {
            throw new Error("Either startDate or endDate must be provided.");
        }

        // Make the API request
        const response = await axios.post(
            `${API_URL}reno-progress/${renoProgressId}/contractual/${dateType}/date`,
            payload,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const changeRenoProgressContractualHandoverDate = async (renoProgressId: number, startDate: string) => {
    try {
        const response = await axios.post(API_URL + `reno-progress/${renoProgressId}/contractual/handover/date`, { start_date: startDate }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const changeRenoProgressContractorDate = async (renoProgressId: number, dateType: string, startDate?: string, endDate?: string) => {
    try {
        // Determine which field to update
        const payload: { start_date?: string; end_date?: string } = {};

        if (startDate) {
            payload.start_date = startDate;
        } else if (endDate) {
            payload.end_date = endDate;
        }

        // Proceed if either startDate or endDate is provided
        if (Object.keys(payload).length === 0) {
            throw new Error("Either startDate or endDate must be provided.");
        }

        // Make the API request
        const response = await axios.post(
            `${API_URL}reno-progress/${renoProgressId}/contractor/${dateType}/date`,
            payload,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const changeRenoProgressContractorHandoverDate = async (renoProgressId: number, startDate: string) => {
    try {
        const response = await axios.post(API_URL + `reno-progress/${renoProgressId}/contractor/handover/date`, { start_date: startDate }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const fetchDefectInspectionForm = async (diFormId: number) => {
    try {
        const response = await axios.get(API_URL + `defect-inspection-forms/${diFormId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchProgressKeyManagement = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/key-management`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchKeyManagement = async (keyManagementId: number) => {
    try {
        const response = await axios.get(API_URL + `key-management/${keyManagementId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchDIForm = async (diFormId: number) => {
    try {
        const response = await axios.get(API_URL + `di-forms/${diFormId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const addDIForm = async (diForm: any) => {
    try {
        const response = await axios.post(API_URL + `di-forms/addDIF`, diForm, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchDIFormWithHashedString = async (hashedString: string) => {
    try {
        const response = await axios.get(API_URL + `defect-inspection-forms/public/${hashedString}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const markDIFormAsCompleted = async (diFormId: number) => {
    try {
        const response = await axios.get(API_URL + `defect-inspection-forms/${diFormId}/completed`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const toggleDIFormReportLinkStatus = async (diFormId: number) => {
    try {
        const response = await axios.get(API_URL + `defect-inspection-forms/${diFormId}/report-link/toggle`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const generateDIForm = async (diFormId: number) => {
    try {
        const response = await axios.get(API_URL + `di-forms/${diFormId}/generate`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const addKeyManagementItem = async (keyManagementId: number, category: string) => {
    try {
        const response = await axios.get(API_URL + `key-management/${keyManagementId}/${category}/add`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const changeKeyManagementItemName = async (keyManagementId: number, category: string, itemIndex: number, name: string) => {
    try {
        const response = await axios.post(API_URL + `key-management/${keyManagementId}/${category}/change/${itemIndex}/name`, { name }, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const changeKeyManagementItemRemark = async (keyManagementId: number, category: string, itemIndex: number, remark: string) => {
    try {
        const response = await axios.post(API_URL + `key-management/${keyManagementId}/${category}/change/${itemIndex}/remark`, { remark }, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const uploadKeyManagementItemPhoto = async (keyManagementId: number, category: string, itemIndex: number, file: File) => {
    try {
        const formData = new FormData();

        formData.append('attachment', file);

        const response = await axios.post(
            `${API_URL}key-management/${keyManagementId}/${category}/upload/${itemIndex}/photo`, formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
}

export const changeKeyManagementItemPhoto = async (keyManagementId: number, category: string, itemIndex: number, file: File) => {
    try {
        const formData = new FormData();

        formData.append('attachment', file);

        const response = await axios.post(
            `${API_URL}key-management/${keyManagementId}/${category}/change/${itemIndex}/photo`, formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Axios sets the proper boundary for this type
                }
            }
        );

        return response.data; // Return response data

    } catch (error) {
        // Handle errors like 401 or other server-side errors
        handle401Error(error as AxiosError);
        throw error; // Rethrow the error for further handling
    }
}

export const removeKeyManagementItem = async (keyManagementId: number, category: string, itemIndex: number) => {
    try {
        const response = await axios.get(API_URL + `key-management/${keyManagementId}/${category}/remove/${itemIndex}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const updateKeyManagementInfo = async (keyManagementId: number, keyManagement: KeyManagement) => {
    try {
        const response = await axios.post(API_URL + `key-management/${keyManagementId}/info/update`, keyManagement, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const updateKeyCategoryQuantity = async (keyManagementId: number, category: string, quantity: number) => {
    try {
        const data = { category, quantity };

        const response = await axios.post(API_URL + `key-management/${keyManagementId}/quantity/update`, data, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchRPMDIForms = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, status?: string, isHead: boolean = true) => {
    try {
        const response = await axios.get(API_URL + `defect-inspection-forms`, {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                status: status,
                head: isHead
            }
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const createPurchaseOrder = async (purchaseOrderData: PurchaseOrder) => {
    try {
        const response = await axios.post(API_URL + 'purchase-orders', purchaseOrderData, {
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

export const updatePurchaseOrder = async (poId: number, purchaseOrderData: PurchaseOrder) => {
    try {
        const response = await axios.put(API_URL + `purchase-orders/${poId}`, purchaseOrderData, {
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

export const POIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, isHead: boolean = true) => {
    try {
        const response = await axios.get(API_URL + 'purchase-orders', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                head: isHead,
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const POAdvanceTable = async (groubBy?: string, groupOp?: string, groupValue?: string, filterBy?: string, filterOp?: string, filterValue?: string) => {
    try {
        const response = await axios.get(API_URL + 'purchase-orders/table/advance', {
            headers: getAuthHeaders(),
            params: {
                groubBy: groubBy,
                groupOp: groupOp,
                groupValue: groupValue,
                filterBy: filterBy,
                filterOp: filterOp,
                filterValue: filterValue
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

export const fetchPO = async (poId: number) => {
    try {
        const response = await axios.get(API_URL + `purchase-orders/${poId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const markPOItemAsDelivered = async (poId: number) => {
    try {
        const response = await axios.get(API_URL + `purchase-orders/${poId}/delivery/status/delivered`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const releasePO = async (poId: number) => {
    try {
        const response = await axios.get(API_URL + `purchase-orders/${poId}/order/status/released`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const acceptPO = async (poId: number) => {
    try {
        const response = await axios.get(API_URL + `purchase-orders/${poId}/order/status/accepted`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const rejectPO = async (poId: number) => {
    try {
        const response = await axios.get(API_URL + `purchase-orders/${poId}/order/status/rejected`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const revertPO = async (poId: number) => {
    try {
        const response = await axios.get(API_URL + `purchase-orders/${poId}/order/status/unreleased`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const createPOInvoice = async (poData: PurchaseOrder) => {
    try {
        const response = await axios.post(API_URL + `purchase-orders/invoice/create`, poData, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const inventoryIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'inventory', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const otpRequestsIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'otp-requests', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};