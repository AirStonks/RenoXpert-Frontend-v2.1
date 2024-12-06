import { File } from "buffer";

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
    status?: string;
    address?: Address;
    password?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Product {
    id?: number;
    name: string;
    SKU?: string;
    pm_category_id?: number;
    pm_category?: string | number;
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
    task_weightage?: number;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PMCategory {
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
    form_id?: string,
    user?: User,
    property_id?: string,
    property?: Property,
    bedroom_count?: number,
    bathroom_count?: number,
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
    created_by?: string,
    updated_by?: string,
    created_at?: string,
    updated_at?: string,
}

export interface OrderQuotation {
    id?: string,
    order_id?: string,
    form_id?: string,
    order?: Order,
    quotation_id?: string,
    quotation_name?: string,
    quotation?: Quotation,
    total_amount?: number,
    description?: string,
    version: number,
    packages?: Package[],
    metadata?: JSON,
    created_by?: User,
    updated_by?: string,
    created_at?: string,
    updated_at?: string,
}

export interface Sale {
    id?: string,
    sales_no?: string,
    order_id?: string,
    order?: Order,
    invoices?: Invoice[],
    reno_progress_id?: string,
    user_id?: string,
    user?: string,
    description?: string,
    total_amount?: number,
    remaining_amount?: number,
    remaining_percentage?: number,
    paid_percentage?: number,
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
    form_no?: string;
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

export interface DefectInspectionForm {
    id?: string,
    reno_progress_id?: string,
    date?: string,
    time?: string,
    owner_email?: string,
    property?: {
        id?: string,
        property_name?: string,
        other_property_name?: string,
        block?: string,
        level?: string,
        unit?: string,
    },
    contractor_name?: string,
    contractor_email?: string,
    bedroom_count?: string | number,
    bathroom_count?: string | number,
    area?: {
        foyer?: {
            q1?: FormQuestion,
            q2?: FormQuestion,
            q3?: FormQuestion,
            q4?: FormQuestion,
        },
        kitchen?: {
            q1?: FormQuestion,
            q2?: FormQuestion,
            q3?: FormQuestion,
            q4?: FormQuestion,
            q5?: FormQuestion,
            q6?: FormQuestion,
            q7?: FormQuestion,
            q8?: FormQuestion,
        },
        yard?: {
            q1?: FormQuestion,
            q2?: FormQuestion,
            q3?: FormQuestion,
            q4?: FormQuestion,
            q5?: FormQuestion,
            q6?: FormQuestion,
            q7?: FormQuestion,
            q8?: FormQuestion,
        },
        living?: {
            q1?: FormQuestion,
            q2?: FormQuestion,
            q3?: FormQuestion,
            q4?: FormQuestion,
            q5?: FormQuestion,
            q6?: FormQuestion,
            q7?: FormQuestion,
            q8?: FormQuestion,
            q9?: FormQuestion,
        },
        balcony?: {
            q1?: FormQuestion,
            q2?: FormQuestion,
            q3?: FormQuestion,
            q4?: FormQuestion,
        },
        hallway?: {
            q1?: FormQuestion,
            q2?: FormQuestion,
            q3?: FormQuestion,
            q4?: FormQuestion,
        },
        bedrooms?: {
            [bedroom: string]: {
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                q8?: FormQuestion,
                q9?: FormQuestion,
            }
        },
        bathrooms?: {
            [bathroom: string]: {
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                q8?: FormQuestion,
                q9?: FormQuestion,
            }
        }
    }
    status?: string,
    created_at?: string,
    updated_at?: string,
}

export interface QCForm {
    id?: string,
    reno_progress_id?: string,
    date?: string,
    time?: string,
    property?: {
        id?: string,
        property_name?: string,
        other_property_name?: string,
        block?: string,
        level?: string,
        unit?: string,
    },
    bedroom_count?: string | number,
    bathroom_count?: string | number,
    include_commune_living?: boolean,
    inspector_first_name?: string,
    inspector_last_name?: string,
    inspector_role?: 'belive' | 'contractor' | 'owner',
    contractor_email?: string,
    area?: {
        foyer?: {
            s1?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s2?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s3?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s4?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                attachments?: Attachment,
            },
            s5?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                attachments?: Attachment,
            },
            s6?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                attachments?: Attachment,
            }
        },
        kitchen?: {
            s1?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s2?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s3?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                attachments?: Attachment,
            },
            s4?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                q8?: FormQuestion,
                q9?: FormQuestion,
                q10?: FormQuestion,
                q11?: FormQuestion,
                attachments?: Attachment,
            },
            s5?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                q8?: FormQuestion,
                attachments?: Attachment,
            },
        },
        laundry?: {
            s1?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                attachments?: Attachment,
            },
            s2?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s3?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                attachments?: Attachment,
            },
            s4?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                attachments?: Attachment,
            },
        },
        dining?: {
            s1?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                q8?: FormQuestion,
                attachments?: Attachment,
            },
            s2?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                attachments?: Attachment,
            },
            s3?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s4?: {
                label?: string,
                other?: FormQuestion
            }
        },
        commune?: {
            s1?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                attachments?: Attachment,
            },
            s2?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                q6?: FormQuestion,
                q7?: FormQuestion,
                q8?: FormQuestion,
                attachments?: Attachment,
            },
            s3?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s4?: {
                label?: string,
                q1?: FormQuestion,
                q2?: FormQuestion,
                q3?: FormQuestion,
                q4?: FormQuestion,
                q5?: FormQuestion,
                attachments?: Attachment,
            },
            s5?: {
                label?: string,
                other?: FormQuestion
            }
        } | null,
        bedrooms?: {
            [bedroom: string]: {
                s1?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    attachments?: Attachment,
                },
                s2?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    q7?: FormQuestion,
                    q8?: FormQuestion,
                    attachments?: Attachment,
                },
                s3?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    attachments?: Attachment,
                },
                s4?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    q7?: FormQuestion,
                    q8?: FormQuestion,
                    attachments?: Attachment,
                },
                s5?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    q7?: FormQuestion,
                    q8?: FormQuestion,
                    q9?: FormQuestion,
                    q10?: FormQuestion,
                    q11?: FormQuestion,
                    q12?: FormQuestion,
                    attachments?: Attachment,
                },
                s6?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    attachments?: Attachment,
                },
                s7?: {
                    label?: string,
                    other?: FormQuestion
                }
            }
        },
        bathrooms?: {
            [bathroom: string]: {
                s1?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    attachments?: Attachment,
                },
                s2?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    attachments?: Attachment,
                },
                s3?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    attachments?: Attachment,
                },
                s4?: {
                    label?: string,
                    q1?: FormQuestion,
                    q2?: FormQuestion,
                    q3?: FormQuestion,
                    q4?: FormQuestion,
                    q5?: FormQuestion,
                    q6?: FormQuestion,
                    q7?: FormQuestion,
                    q8?: FormQuestion,
                    q9?: FormQuestion,
                    q10?: FormQuestion,
                    attachments?: Attachment,
                },
                s5?: {
                    label?: string,
                    other?: FormQuestion
                }
            }
        }
    },
    status?: string,
    created_at?: string,
    updated_at?: string,
}

export interface FormQuestion {
    label?: string,
    value?: string,
    attachments?: {
        [key: string]: Attachment
    },
    remark?: string,
}

export interface Attachment {
    id?: string;
    original_name?: string;
    file_url?: string;
    file?: File;
}

export interface RenoProgress {
    id?: string,
    sale_id?: string,
    sale?: Sale,
    phases?: ProgressPhase[],
    status?: string,
    start_date?: string,
    end_date?: string,
    pre_reno_completion?: number,
    reno_completion?: number,
    post_reno_completion?: number,
    completed_at?: string,
    created_at?: string,
    updated_at?: string,
}

export interface ProgressPhase {
    id?: string,
    name?: string,
    progress_id?: string,
    jobs?: PhaseJob[],
    status?: string,
    completed_at?: string,
    created_at?: string,
    updated_at?: string,
}

export interface PhaseJob {
    id?: string,
    name?: string,
    phase_id?: string,
    priority?: number,
    tasks?: JobTask[],
    status?: string,
    completed_at?: string,
    created_at?: string,
    updated_at?: string,
}

export interface JobTask {
    id?: string,
    name?: string,
    phase_id?: string,
    qty?: number,
    priority?: number,
    task_weightage?: number,
    is_supplied?: boolean,
    is_installed?: boolean,
    supply_date?: string,
    install_date?: string,
    attachments?: {
        [key: string]: {
            id?: string;
            original_name?: string;
            file_url?: string;
        }
    },
    is_defect_form?: boolean,
    is_qc_form?: boolean,
    status?: string,
    owner_comment?: string,
    internal_comment?: string,
    completed_at?: string,
    created_at?: string,
    updated_at?: string,
}

export interface RenoAccetanceForm {
    id?: string,
    is_accepted?: boolean,
    date?: string,
    property?: {
        property_name?: string,
        block?: string,
        level?: string,
        unit?: string,
    },
    user?: {
        id?: string;
        name?: string,
        email?: string;
        phone_no?: string;
    };
    signature?: Attachment,
    status?: string,
    created_at?: string,
    updated_at?: string,
}

export interface Inventory {
    id?: string,
    product_id?: string,
    product?: Product,
    alert_level?: number,
    total_stock?: number,
    current_stock?: number,
    coming_stock?: number,
    total_available_stock?: number,
    total_required_stock?: number,
    utilized_stock?: number,
    required_stock?: number,
    current_balance?: number,
    total_balance?: number,
    status?: string,
    created_by?: string,
    updated_by?: string,
    created_at?: string,
    updated_at?: string,
}

export interface PurchaseOrder {
    id?: string,
    po_no?: string,
    sale_id?: string,
    sale?: Sale,
    vendor_id?: string,
    vendor?: User,
    items?: POItem[],
    total_amount?: number,
    shipping_date?: string,
    shipped_date?: string,
    delivery_date?: string,
    delivered_date?: string,
    payment_status?: string,
    order_status?: string,
    description?: string,
    internal_note?: string,
    created_by?: string,
    updated_by?: string,
    created_at?: string,
    updated_at?: string,
}

export interface POItem {
    id?: string,
    product_id?: string,
    product_name?: string,
    product_desc?: string,
    qty?: number,
    supply?: boolean,
    install?: boolean,
    unit_price?: number,
    supply_price?: number,
    install_price?: number,
    total_price?: number,
    status?: string,
    shipping_date?: string,
    shipped_date?: string,
    delivery_date?: string,
    delivered_date?: string,
    created_by?: string,
    updated_by?: string,
}