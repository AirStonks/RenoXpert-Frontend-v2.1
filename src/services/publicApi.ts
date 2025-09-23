import axios from 'axios';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

export const getOwnerUser = async () => {
    try {
        const token = localStorage.getItem('o_token');

        const response = await axios.get(API_URL + 'user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;

    } catch (error) {
        if (error.status === 401) {
            return {
                status: 401,
                message: 'Unauthorized',
            }
        }
    }
};


export const getProperties = async () => {
    try {
        const response = await axios.get(API_URL + 'public/properties');
        return response.data;
    } catch (error) {
        console.log(error);
    }
};


export const fetchDIFormWithHashedString = async (hashedString: string) => {
    try {
        const response = await axios.get(API_URL + `defect-inspection-forms/public/${hashedString}`);
        return response.data; // Return product data
    } catch (error) {
        console.log(error);
        throw error; // Ensure to throw the error if needed
    }
}

export const submitInvestorInterestForm = async (data: any) => {
    try {
        const response = await axios.post(API_URL + `investor-interest-form`, data);
        return response.data; // Return product data
    } catch (error) {
        console.log(error);
        throw error; // Ensure to throw the error if needed
    }
}

export const getCampaign = async (campaignId: string) => {
    try {
        const response = await axios.get(API_URL + `public/campaigns/${campaignId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching campaign:', error);
        throw error;
    }
}

export const validateBookingReference = async (campaignId: string, bookingReference: string) => {
    try {
        const response = await axios.get(API_URL + `public/bookings/validate?campaign_id=${campaignId}&booking_hash=${bookingReference}`);
        return response.data;
    } catch (error) {
        console.error('Error validating booking reference:', error);
        throw error;
    }
}

export const bookingPaymentIntent = async (bookingId: string, name: string, phone: string, amount: number, packageId?: string) => {
    try {
        const response = await axios.post(API_URL + `public/bookings/${bookingId}/payment/intent`, { name, phone, amount, packageId });
        return response.data;
    } catch (error) {
        console.error('Error creating booking payment intent:', error);
        throw error;
    }
}