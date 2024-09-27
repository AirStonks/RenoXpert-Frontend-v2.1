export interface MyData {
    key: string;
}

export interface FormValues {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface Product {
    id?: number;
    name: string;
    SKU?: string;
    category_id?: number;
    category?: string | number;
    pivot?: { 
        quantity: number
    }
    type?: string;
    description?: string;
    price?: number;
    status?: string;
    premium_price?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ProductCategory {
    id?: number;
    name: string;
    description?: string;
}

export interface Package {
    id?: number;
    name: string;
    description?: string;
    total_price?: number;
    products?: Product[];
}

export interface Quotation {
    id?: string;
    name: string;
    description?: string;
    total_amount: number;
    valid_from?: string;
    valid_until?: string;
    metadata?: JSON;
}

export interface Contact {
    id?: string,
    name: string,
    email?: string,
    phone_no?: string,
    alt_phone_no?: string,
    race?: string,
    gender?: string,
    nationality?: string,
    description?: string,
}

export interface Property {
    id?: string,
    name: string,
    address?: string,
    street?: string,
    postcode?: string,
    city?: string,
    state?: string,
    description?: string,
}

export interface Order {
    id?: string,
    order_no?: string,
    contact_id?: string,
    property_id?: string,
    quotation_id?: string,
    block?: string,
    floor?: string,
    unit_no?: string,
    unit_name?: string,
    description?: string,
    metadata?: JSON,
}