export interface MyData {
    key: string;
}

export interface FormValues {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface Address {
    id?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
}

export interface User {
    id?: string;
    name?: string;
    name_first?: string;
    name_last?: string;
    name_preferred?: string;
    salutations?: string;
    ic?: string;
    email?: string;
    phone_no?: string;
    type?: string;
    address?: Address;
    password?: string;
    created_at?: string;
    updated_at?: string;
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
        internal_note?: string;
        includeSupply?: boolean;
        includeInstall?: boolean;
    }
    provisioning?: {
        supply?: {
            id?: string;
            retail_price?: number;
            cogs?: number;
            excluded_price?: number;
            status?: string;
        },
        install?: {
            id?: string;
            retail_price?: number;
            cogs?: number;
            excluded_price?: number;
            status?: string;
        }
    }
    type?: string;
    description?: string;
    uom?: string;
    status?: string;
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
    name?: string;
    description?: string;
    total_price?: number;
    products?: Product[];
    description_internal?: string;
}

export interface Quotation {
    id?: string;
    name: string;
    description?: string;
    total_amount: number;
    valid_from?: string;
    valid_until?: string;
    metadata?: JSON;
    packages?: Package[];
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
    user_id?: string,
    user?: User,
    property_id?: string,
    property?: Property,
    sale?: Sale,
    quotation_id?: string,
    order_quotations?: OrderQuotation[],
    latest_quotation?: OrderQuotation,
    block?: string,
    floor?: string,
    unit_no?: string,
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
    quotation_name?: string,
    quotation?: Quotation,
    total_amount?: number,
    description?: string,
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
    payments?: Payment[],
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

export interface Payment {
    id?: string,
    invoice_id?: string,
    transaction_no?: string,
    amount?: number,
    payment_method?: string,
    currency?: string,
    description?: string,
    status?: string,
    created_at?: string,
    updated_at?: string,
}

export interface OwnerRegistrationForm {
    id?: string;
    salutations?: string;
    name_first?: string;
    name_last?: string;
    name_preferred?: string;
    email?: string;
    country_code?: string;
    phone_no?: string;
    user?: {
        id?: string;
        salutations?: string;
        name_first?: string;
        name_last?: string;
        name_preferred?: string;
        email?: string;
        country_code?: string;
        phone_no?: string;
        ic?: string;
    };
    address?: Address
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    ic?: string;
    property?: {
        id?: string;
        property_name?: string;
        block?: string;
        level?: string;
        unit?: string;
        layout_type?: string;
        sqft?: string;
    }
    property_name?: string;
    other_property_name?: string;
    other_property?: {
        property_name?: string;
        block?: string;
        level?: string;
        unit?: string;
        layout_type?: string;
        sqft?: string;
    };
    block?: string;
    level?: string;
    unit?: string;
    layout_type?: string;
    sqft?: string;
    metadata?: string;
    questions?: {
        quest_1?: string;
        quest_2?: string;
        quest_3?: string;
        quest_4?: string;
        quest_5?: string;
        quest_6?: string;
        quest_7?: string;
        quest_8?: string;
    }
    status?: string;
    furnishing?: {
        foyer_entrance?: {
            grille_door?: string;
            digital_lock?: string;
            shoe_cabinet?: string;
            lights?: string;
            other?: string;
        },
        kitchen?: {
            kitchen_cabinet?: string;
            kitchen_island?: string;
            sink_tap?: string;
            hood_hob?: string;
            microwave?: string;
            oven?: string;
            water_dispenser?: string;
            fridge?: string;
            lights?: string;
            other?: string;
        },
        yard?: {
            washer?: string;
            dryer?: string;
            lights?: string;
            other?: string;
        },
        dining?: {
            dining_table_chairs?: string;
            lights?: string;
            fan?: string;
            other?: string;
        }
        living?: {
            sofa?: string;
            coffee_table?: string;
            tv?: string;
            tv_cabinet?: string;
            fan?: string;
            lights?: string;
            ac?: string;
            other?: string;
        }
    }
    attachments?: {
        [key: string]: {
            id?: number;
            original_name?: string;
            file_url?: string;
        }
    }
    created_at?: string,
    updated_at?: string,
}