// src\services\api.ts

import axios, { AxiosError } from 'axios';
import { handle401Error } from '../utils/error401'; // Adjust the import path as needed
import { ApiKey, ApiKeyCreateRequest, ApiKeyUpdateRequest, DiscountFee, Invoice, Inventory, InventoryVariant, KeyManagement, Order, QuotationRequestForm, Package, Payment, PMCategory, Product, Property, PurchaseOrder, QCForm, Quotation, Sale, User } from '../types';

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

export const getCurrentUser = async () => {
    try {
        const response = await axios.get(API_URL + 'user', { headers: getAuthHeaders() });
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

export const updateUser = async (userId: number, userData: User) => {
    try {
        const response = await axios.put(API_URL + `users/${userId}`, userData, {
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

export const productIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + 'products', {
            headers: getAuthHeaders(),
            signal,
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
        if (error.code === 'ERR_CANCELED') {
            console.log('Request canceled:', error.message);
            return;
        }

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

export const packageIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, isHead: boolean = true, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + 'packages', {
            headers: getAuthHeaders(),
            signal,
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
        if (error.code === 'ERR_CANCELED') {
            console.log('Request canceled:', error.message);
            return;
        }

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

export const fetchProperty = async (propertyId: number, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + `properties/${propertyId}`, {
            headers: getAuthHeaders(),
            signal // Pass the AbortSignal to Axios
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

export const updatePropertyWithFiles = async (
    propertyId: number,
    propertyData: Property,
    files: { thumbnail?: File; galleryImages?: File[], designRenderingImages?: File[] },
) => {
    try {
        const formData = new FormData()

        // Add property data as JSON string
        formData.append("property_data", JSON.stringify(propertyData))

        // Add thumbnail file if exists
        if (files.thumbnail) {
            formData.append("thumbnail", files.thumbnail)
        }

        // Add gallery images if exist
        if (files.galleryImages && files.galleryImages.length > 0) {
            files.galleryImages.forEach((file, index) => {
                formData.append(`gallery_images[${index}]`, file)
            })
        }

        // Add design rendering images if exist
        if (files.designRenderingImages && files.designRenderingImages.length > 0) {
            files.designRenderingImages.forEach((file, index) => {
                formData.append(`design_rendering[${index}]`, file)
            })
        }

        const response = await axios.post(API_URL + `properties/${propertyId}/update`, formData, {
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "multipart/form-data",
            },
        })
        return response.data
    } catch (error) {
        handle401Error(error as AxiosError)
        throw error
    }
}

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

export const orderIndex = async (size: number = 5,
    page: number = 1,
    searchTerm?: string,
    order?: string,
    field?: string,
    filters?: {
        field: string;
        value: string;
    }[],
    isHead: boolean = true) => {
    try {
        const response = await axios.get(API_URL + 'orders', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                filters: filters,
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

export const voidOrder = async (orderId: number) => {
    try {
        const response = await axios.get(API_URL + `orders/${orderId}/void`, {
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

export const toggleBePowered = async (orderId: number) => {
    try {
        const response = await axios.get(API_URL + `orders/${orderId}/toggle-is-be-powered`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const renoSalesIndex = async (
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

        const response = await axios.get(API_URL + 'reno-sales', {
            headers: getAuthHeaders(),
            params: params
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const fetchRenoSale = async (id: number, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + `reno-sales/${id}`, {
            headers: getAuthHeaders(),
            signal // Pass the AbortSignal to Axios
        })
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
}

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

export const getSalesWithoutReno = async (proeprtyId: number) => {
    try {
        const response = await axios.get(API_URL + `sales/without-reno/${proeprtyId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

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

        const response = await axios.post(API_URL + `invoices/${invoiceId}/payment/save`, formData, {
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
        const response = await axios.get(API_URL + 'owner/quotation-request-form', {
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
        const response = await axios.get(API_URL + `owner/quotation-request-form/${formId}?originalForm=${originalForm}`, {
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
        const response = await axios.get(API_URL + `owner/quotation-request-form/${formId}/status/approve`, {
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
        const response = await axios.get(API_URL + `owner/quotation-request-form/${formId}/status/reject`, {
            headers: getAuthHeaders()
        });

        return response;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const updateRegistrationForm = async (form: QuotationRequestForm) => {
    try {
        const response = await axios.put(API_URL + `owner/quotation-request-form/${form.id}`, form, {
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

export const investorInterestIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + 'investor-interest-forms', {
            headers: getAuthHeaders(),
            signal,
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

export const kayanaHeigInterestIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + 'kaya-heig-forms', {
            headers: getAuthHeaders(),
            signal,
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

export const fetchInvestorInterest = async (formId: number, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + `investor-interest-forms/${formId}`, {
            headers: getAuthHeaders(),
            signal
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const fetchKayaHeigInterest = async (formId: number, signal?: AbortSignal) => {
    try {
        const response = await axios.get(API_URL + `kaya-heig-forms/${formId}`, {
            headers: getAuthHeaders(),
            signal
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

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

export const fetchOldVersionRenoProgress = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/old-ver`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const generateRenoProgress = async (data: any) => {
    try {
        const response = await axios.post(API_URL + 'reno-progress/generate', data, {
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

export const constconvertRenoProgressToV3 = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/convert/v3`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

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

export const changeRPMTaskQcStatus = async (rpmTaskQcId: number, status: string) => {
    try {
        const response = await axios.get(API_URL + `rpm-task-qc/${rpmTaskQcId}/status/${status}`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const updateRPMTaskQcComment = async (rpmTaskQcId: number, comment: string) => {
    try {
        const response = await axios.put(API_URL + `rpm-task-qc/${rpmTaskQcId}/comment/internal`, { internal_comment: comment }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const uploadRPMTaskQcAttachment = async (rpmTaskQcId: number, files: File[]) => {
    try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append each file to the FormData object
        files.forEach(file => {
            formData.append('internal_attachments[]', file);  // 'attachments[]' because your backend expects an array
        });

        // Make the API request
        const response = await axios.post(API_URL + `rpm-task-qc/${rpmTaskQcId}/attachment/internal/upload`,
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

export const removeRPMTaskQcAttachment = async (rpmTaskQcId: number, attachmentIndex: number) => {
    try {
        const response = await axios.get(API_URL + `rpm-task-qc/${rpmTaskQcId}/attachment/internal/${attachmentIndex}/remove`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const renoProgressIndex = async (
    size: number = 5,
    page: number = 1,
    searchTerm?: string,
    order?: string,
    field?: string,
    filters?: {
        field: string;
        value: string;
    }[],
    isHead: boolean = true,
    rpm_version: number = null) => {
    try {
        const response = await axios.get(API_URL + 'reno-progress', {
            headers: getAuthHeaders(),
            params: {
                size: size,
                page: page,
                search: searchTerm,
                sortOrder: order,
                sortField: field,
                filters: filters,
                head: isHead,
                rpm_version: rpm_version,
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const updateRenoProgressStatus = async (renoProgressId: number, status: string) => {
    try {
        const response = await axios.put(API_URL + `reno-progress/${renoProgressId}/status`, {
            status: status
        }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
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

export const sendRenoToLark = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/send-reno-to-lark`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
}

export const changeDateManagement = async (renoProgressId: number, field: string, value: string) => {
    try {
        // Determine which field to update
        const payload: { sales_date?: string; defect_permit_date?: string } = {};

        if (field === 'sales_date') {
            payload.sales_date = value;
        } else if (field === 'defect_permit_date') {
            payload.defect_permit_date = value;
        }

        // Proceed if either startDate or endDate is provided
        if (Object.keys(payload).length === 0) {
            throw new Error("Either startDate or endDate must be provided.");
        }

        // Make the API request
        const response = await axios.post(
            `${API_URL}reno-progress/${renoProgressId}/date-management/change`,
            payload,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

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

export const addKeyManagementItem = async (renoProgressId: number, category: string) => {
    try {
        const response = await axios.get(API_URL + `key-management/${renoProgressId}/${category}/add`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const changeKeyManagementItemName = async (renoProgressId: number, category: string, itemIndex: number, name: string) => {
    try {
        const response = await axios.post(API_URL + `key-management/${renoProgressId}/${category}/change/${itemIndex}/name`, { name }, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const changeKeyManagementItemRemark = async (renoProgressId: number, category: string, itemIndex: number, remark: string) => {
    try {
        const response = await axios.post(API_URL + `key-management/${renoProgressId}/${category}/change/${itemIndex}/remark`, { remark }, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const uploadKeyManagementItemPhoto = async (renoProgressId: number, category: string, itemIndex: number, file: File) => {
    try {
        const formData = new FormData();

        formData.append('attachment', file);

        const response = await axios.post(
            `${API_URL}key-management/${renoProgressId}/${category}/upload/${itemIndex}/photo`, formData,
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

export const changeKeyManagementItemPhoto = async (renoProgressId: number, category: string, itemIndex: number, file: File) => {
    try {
        const formData = new FormData();

        formData.append('attachment', file);

        const response = await axios.post(
            `${API_URL}key-management/${renoProgressId}/${category}/change/${itemIndex}/photo`, formData,
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

export const removeKeyManagementItem = async (renoProgressId: number, category: string, itemIndex: number) => {
    try {
        const response = await axios.get(API_URL + `key-management/${renoProgressId}/${category}/remove/${itemIndex}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return product data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
}

export const updateKeyManagementInfo = async (renoProgressId: number, keyManagement: KeyManagement) => {
    try {
        const response = await axios.post(API_URL + `key-management/${renoProgressId}/info/update`, keyManagement, {
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

export const fetchPurchaseOrdersBySaleId = async (saleId: string) => {
    try {
        const response = await axios.get(API_URL + `purchase-orders/sale/${saleId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
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

export const poIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, isHead: boolean = true) => {
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

export const poAdvanceTable = async (groubBy?: string, groupOp?: string, groupValue?: string, filterBy?: string, filterOp?: string, filterValue?: string) => {
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

export const fetchPo = async (poId: number) => {
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

export const inventoryIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string, filters: FilterParams = {}) => {
    try {
        const params: any = {
            size: size,
            page: page,
            search: searchTerm,
            sortOrder: order,
            sortField: field
        };

        if (Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params[`filter[${key}]`] = value;
                }
            });
        }

        // Debug logging
        console.log('Inventory API Request:', {
            url: API_URL + 'inventory',
            params: params,
            filters: filters
        });

        const response = await axios.get(API_URL + 'inventory', {
            headers: getAuthHeaders(),
            params: params
        });
        
        // Debug logging
        console.log('Inventory API Response:', {
            totalCount: response.data?.totalCount,
            dataCount: response.data?.data?.length,
            sampleStatuses: response.data?.data?.slice(0, 5).map((item: any) => item.status)
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const fetchInventory = async (inventoryId: number) => {
    try {
        const response = await axios.get(API_URL + `inventory/${inventoryId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return inventory data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const createInventory = async (inventoryData: Inventory) => {
    try {
        const response = await axios.post(API_URL + 'inventory', inventoryData, {
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

export const updateInventory = async (inventoryData: Inventory) => {
    try {
        const response = await axios.put(API_URL + `inventory/${inventoryData.id}`, inventoryData, {
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

export const removeInventory = async (inventoryId: number) => {
    try {
        const response = await axios.delete(API_URL + `inventory/${inventoryId}`, {
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

export const inventoryVariantIndex = async (size: number = 5, page: number = 1, searchTerm?: string, inventoryItemId?: number, signal?: AbortSignal) => {
    try {
        const params: any = {
            size: size,
            page: page,
            search: searchTerm,
        };

        if (inventoryItemId !== undefined) {
            params.inventory_item_id = inventoryItemId;
        }

        const response = await axios.get(API_URL + 'inventory-variants', {
            headers: getAuthHeaders(),
            signal,
            params: params
        });
        return response.data;
    } catch (error) {
        if (error.code === 'ERR_CANCELED') {
            console.log('Request canceled:', error.message);
            return;
        }

        handle401Error(error as AxiosError);
    }
};

export const fetchInventoryVariant = async (variantId: number) => {
    try {
        const response = await axios.get(API_URL + `inventory-variants/${variantId}`, {
            headers: getAuthHeaders()
        });
        return response.data; // Return variant data
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error; // Ensure to throw the error if needed
    }
};

export const createInventoryVariant = async (variantData: InventoryVariant) => {
    try {
        const response = await axios.post(API_URL + 'inventory-variants', variantData, {
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

export const updateInventoryVariant = async (variantData: InventoryVariant) => {
    try {
        const response = await axios.put(API_URL + `inventory-variants/${variantData.id}`, variantData, {
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

export const removeInventoryVariant = async (variantId: number) => {
    try {
        const response = await axios.delete(API_URL + `inventory-variants/${variantId}`, {
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

// API Key Management Functions
export const apiKeysIndex = async (size: number = 10, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'api-keys', {
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
        throw error;
    }
};

export const createApiKey = async (apiKeyData: ApiKeyCreateRequest) => {
    try {
        const response = await axios.post(API_URL + 'api-keys', apiKeyData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const updateApiKey = async (apiKeyId: string, apiKeyData: ApiKeyUpdateRequest) => {
    try {
        const response = await axios.put(API_URL + `api-keys/${apiKeyId}`, apiKeyData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const revokeApiKey = async (apiKeyId: string) => {
    try {
        const response = await axios.delete(API_URL + `api-keys/${apiKeyId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const regenerateApiKey = async (apiKeyId: string) => {
    try {
        const response = await axios.post(API_URL + `api-keys/${apiKeyId}/regenerate`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

// Owner Handover Functions
export const releaseOwnerHandover = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/owner-handover/release`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const submitOwnerHandover = async (renoProgressId: number) => {
    try {
        const response = await axios.get(API_URL + `reno-progress/${renoProgressId}/owner-handover/submit`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const campaignIndex = async (size: number = 5, page: number = 1, searchTerm?: string, order?: string, field?: string) => {
    try {
        const response = await axios.get(API_URL + 'campaigns', {
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

export const campaignDetail = async (id: string | number) => {
    try {
        const response = await axios.get(API_URL + `campaigns/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const createCampaign = async (campaignData: any) => {
    try {
        const formData = new FormData();
        
        // Add all campaign data to FormData
        Object.keys(campaignData).forEach(key => {
            if (key === 'packages' && campaignData[key]) {
                // Handle packages array
                campaignData[key].forEach((pkg: any, index: number) => {
                    Object.keys(pkg).forEach(pkgKey => {
                        // Skip null/undefined so they aren't appended as the literal strings
                        // "null"/"undefined" (FormData coerces them), which fail backend
                        // nullable|integer rules — e.g. layout_type_id on flat campaigns.
                        if (pkg[pkgKey] !== null && pkg[pkgKey] !== undefined) {
                            formData.append(`packages[${index}][${pkgKey}]`, pkg[pkgKey]);
                        }
                    });
                });
            } else if (key === 'layout_types' && campaignData[key]) {
                // Handle layout_types array
                (campaignData[key] as Record<string, string | Blob>[]).forEach((lt, index: number) => {
                    Object.keys(lt).forEach(ltKey => {
                        if (lt[ltKey] !== null && lt[ltKey] !== undefined) {
                            formData.append(`layout_types[${index}][${ltKey}]`, lt[ltKey]);
                        }
                    });
                });
            } else if (key === 'thumbnail' && campaignData[key] instanceof File) {
                // Handle thumbnail file
                formData.append('thumbnail', campaignData[key]);
            } else if (campaignData[key] !== null && campaignData[key] !== undefined) {
                formData.append(key, campaignData[key]);
            }
        });

        const response = await axios.post(API_URL + 'campaigns', formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const updateCampaign = async (id: string | number, campaignData: any) => {
    try {
        const formData = new FormData();
        
        // Add all campaign data to FormData
        Object.keys(campaignData).forEach(key => {
            if (key === 'packages' && campaignData[key]) {
                // Handle packages array
                campaignData[key].forEach((pkg: any, index: number) => {
                    Object.keys(pkg).forEach(pkgKey => {
                        // Skip null/undefined so they aren't appended as the literal strings
                        // "null"/"undefined" (FormData coerces them), which fail backend
                        // nullable|integer rules — e.g. layout_type_id on flat campaigns.
                        if (pkg[pkgKey] !== null && pkg[pkgKey] !== undefined) {
                            formData.append(`packages[${index}][${pkgKey}]`, pkg[pkgKey]);
                        }
                    });
                });
            } else if (key === 'layout_types' && campaignData[key]) {
                // Handle layout_types array
                (campaignData[key] as Record<string, string | Blob>[]).forEach((lt, index: number) => {
                    Object.keys(lt).forEach(ltKey => {
                        if (lt[ltKey] !== null && lt[ltKey] !== undefined) {
                            formData.append(`layout_types[${index}][${ltKey}]`, lt[ltKey]);
                        }
                    });
                });
            } else if (key === 'thumbnail' && campaignData[key] instanceof File) {
                // Handle thumbnail file
                formData.append('thumbnail', campaignData[key]);
            } else if (campaignData[key] !== null && campaignData[key] !== undefined) {
                formData.append(key, campaignData[key]);
            }
        });

        const response = await axios.post(API_URL + `campaigns/${id}/update`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const uploadCampaignLayoutTypeRentalProjection = async (layoutTypeId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('rental_projection', file);
    const response = await axios.post(`${API_URL}campaign-layout-types/${layoutTypeId}/rental-projection`, formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteCampaignLayoutTypeRentalProjection = async (layoutTypeId: number | string) => {
    const response = await axios.delete(`${API_URL}campaign-layout-types/${layoutTypeId}/rental-projection`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
};

export const uploadCampaignLayoutTypeThumbnail = async (layoutTypeId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('layout_thumbnail', file);
    const response = await axios.post(`${API_URL}campaign-layout-types/${layoutTypeId}/layout-thumbnail`, formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteCampaignLayoutTypeThumbnail = async (layoutTypeId: number | string) => {
    const response = await axios.delete(`${API_URL}campaign-layout-types/${layoutTypeId}/layout-thumbnail`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
};

export const uploadCampaignLayoutTypeRenderings = async (layoutTypeId: number | string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('rendering_images[]', file));
    const response = await axios.post(`${API_URL}campaign-layout-types/${layoutTypeId}/renderings`, formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteCampaignLayoutTypeRendering = async (layoutTypeId: number | string, path: string) => {
    const response = await axios.delete(`${API_URL}campaign-layout-types/${layoutTypeId}/renderings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        data: { path },
    });
    return response.data;
};

export const uploadCampaignThumbnailVideo = async (campaignId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('thumbnail_video', file);
    const response = await axios.post(`${API_URL}campaigns/${campaignId}/thumbnail-video/upload`, formData, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteCampaignThumbnailVideo = async (campaignId: number | string) => {
    const response = await axios.delete(`${API_URL}campaigns/${campaignId}/thumbnail-video`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });
    return response.data;
};

export const deleteCampaign = async (id: string | number) => {
    try {
        const response = await axios.delete(API_URL + `campaigns/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

// Booking API functions
export const createBooking = async (bookingData: any) => {
    try {
        const response = await axios.post(API_URL + 'bookings', bookingData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const getCampaignBookings = async (campaignId: string | number) => {
    try {
        const response = await axios.get(API_URL + `campaigns/${campaignId}/bookings`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const setBookingReferral = async (
    campaignId: string | number,
    bookingId: string | number,
    payload: { referral_code?: string; referred_by_user_id?: number }
) => {
    try {
        const response = await axios.put(
            API_URL + `campaigns/${campaignId}/bookings/${bookingId}/referral`,
            payload,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const updateBooking = async (id: string | number, bookingData: any) => {
    try {
        const response = await axios.put(API_URL + `bookings/${id}`, bookingData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const deleteBooking = async (id: string | number) => {
    try {
        const response = await axios.delete(API_URL + `bookings/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};