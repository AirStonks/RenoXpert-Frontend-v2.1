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
    id?: number;
    name: string;
    description?: string;
    total_amount: number;
    valid_from?: string;
    valid_until?: string;
    metadata?: JSON;
}