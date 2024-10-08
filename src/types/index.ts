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
        visibility: boolean;
        quantity: number;
        included: boolean;
        isOriginal: boolean;
    }
    type?: string;
    description?: string;
    product_retail_price?: number;
    product_cost_of_good_sold?: number;
    product_excluded_price?: number;
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
    contact?: Contact,
    property_id?: string,
    property?: Property,
    quotation_id?: string,
    order_quotations?: OrderQuotation[],
    latest_quotation?: OrderQuotation,
    block?: string,
    floor?: string,
    unit_no?: string,
    unit_name?: string,
    total_amount?: number,
    description?: string,
    status?: string,
    metadata?: JSON,
    created_at?: string,
    updated_at?: string,
}

export interface OrderQuotation {
    id?: string,
    order_id?: string,
    order?: Order,
    quotation_id?: string,
    quotation?: Quotation,
    version: number,
    metadata?: JSON,
}

export interface Sale {
    id?: string,
    sales_no?: string,
    order_id?: string,
    order?: Order,
    invoices?: Invoice[],
    user_id?: string,
    user?: string,
    description?: string,
    total_amount?: number,
    remaining_amount?: number,
    remaining_percentage?: number,
    status?: string,
    created_at?: string,
    updated_at?: string,
}

export interface DiscountFee {
    id?: string,
    name?: string,
    type?: string,
    valueType?: string,
    amount?: number,
    percentage?: number,
    status?: string,
    created_at?: string,
    updated_at?: string,
}

export interface Invoice {
    id?: string,
    sale_id?: string,
    sale?: Sale,
    invoice_no?: string,
    percentage?: number,
    amount?: number,
    status?: string,
    link_status?: string,
    version?: number;
    discountsData?: string | object;
    feesData?: string | object;
    due_date?: string;
    created_at?: string,
    updated_at?: string,
}