import { File } from "buffer";

// Chatwoot SDK type declaration
declare global {
    interface Window {
        chatwootSDK: {
            run: (config: {
                websiteToken: string;
                baseUrl: string;
            }) => void;
        };
    }
}

export interface MyData {
    key: string;
}

export type TaskStatus =
    | "not-applicable"
    | "procurement-done"
    | "pending-stocks"
    | "delivered"
    | "pending-installation"
    | "in-progress"
    | "completed"
    | "to-rectified"
    | "rejected"
    | "not-available"
    | "not-started";

export type TaskQCStatus =
    | "not-started"
    | "accepted"
    | "accepted-with-comment"
    | "to-rectified"
    | "rejected"
    | "not-applicable";

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
    street?: string;
}

export interface Permission {
    id?: string;
    item_id?: string;
    permission_id?: string;
    permission_name?: string;
    permission_description?: string;
    users?: User[];
    roles?: Role[];
    userItems?: User[];
    roleItems?: Role[];
    created_at?: string;
    updated_at?: string;
}

export interface Role {
    id?: string;
    role_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Contact {
    id?: number;
    name?: string;
    email?: string;
    phone_no?: string;
    alt_phone_no?: string;
    race?: string;
    gender?: string;
    nationality?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
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
    country_code?: string;
    phone_no?: string;
    type?: string;
    status?: string;
    address?: Address;
    password?: string;
    pivot?: Permission;
    created_at?: string;
    updated_at?: string;
}

export interface Resource {
    id?: string;
    resource_name?: string;
    resourceItems?: ResourceItem[];
    orders?: Order[];
    renoProgresses?: RenoProgress[];
    created_at?: string;
    updated_at?: string;
}

export interface ResourceItem {
    id?: string;
    resource_id?: string;
    item_reference_id?: string;
    item_reference_type?: string;
    item_name?: string;
    created_by?: User;
    updated_by?: User;
    created_at?: string;
    updated_at?: string;
}

export interface Product {
    id?: number;
    name?: string;
    SKU?: string;
    supplier_name?: string;
    pm_category_id?: number;
    pm_category?: string | number;
    pivot?: {
        visibility?: boolean;
        quantity?: number;
        included?: boolean;
        isOriginal?: boolean;
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
    attachments?: {
        thumbnail?: Attachment;
        photos?: Attachment[];
    }
    color?: string;
    material?: string;
    width?: string;
    height?: string;
    depth?: string;
    internal_desc?: string;
    type?: string;
    description?: string;
    uom?: string;
    task_weightage?: number;
    status?: string;
    created_by?: User;
    updated_by?: User;
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
    monthly_amount?: number;
    tenure?: number;
    markup_percentage?: number;
    markup_amount?: number;
    quantity?: number;
    products?: Product[];
    description_internal?: string;
    category?: string;
    is_addon?: boolean;
    is_addon_included?: boolean;
    is_be_powered?: boolean;
    payment_method?: string;
    status?: string;
    created_by?: User;
    updated_by?: User;
    created_at?: string;
    updated_at?: string;
}

export interface Quotation {
    id?: string;
    name?: string;
    property_id?: string,
    property?: Property,
    description?: string;
    is_ready?: boolean;
    total_amount?: number;
    valid_from?: string;
    valid_until?: string;
    metadata?: string;
    packages?: Package[];
    status?: string;
    created_by?: User;
    updated_by?: User;
    created_at?: string;
    updated_at?: string;
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
    thumbnail_url?: string,
    propertyRoi?: PropertyROI,
    created_by?: User;
    updated_by?: User;
    created_at?: string;
    updated_at?: string;
}

export interface PropertyROI {
    id?: string,
    thumbnail_title?: string,
    thumbnail_desc?: string,
    content?: PropertyROIContent,
    view_enabled?: boolean,
    created_by?: User;
    updated_by?: User;
    created_at?: string;
    updated_at?: string;
}

export interface PropertyROIContent {
    features?: ROICardFeature[],
    gallery?: {
        url?: string
    }[],
    design_rendering?: {
        url?: string
    }[],
}

export interface ROICardFeature {
    icon?: 'shield' | 'star' | 'gift';
    title?: string;
    desc?: string;
    color?: 'blue' | 'amber' | 'emerald'; // Use string literal union
}

export interface ROICardFeatureColor {
    bg?: string;
    text?: string;
    border?: string;
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
    single_bedroom_count?: number,
    queen_bedroom_count?: number,
    studio_count?: number,
    bathroom_count?: number,
    include_partition?: boolean,
    is_progressive_payment?: boolean,
    is_be_powered?: boolean,
    be_powered_base_price?: number,
    installment_method?: string,
    installment_amount?: number,
    sale?: Sale,
    quotation_id?: string,
    order_quotations?: OrderQuotation[],
    latest_quotation?: OrderQuotation,
    unit_type?: string,
    block?: string,
    floor?: string,
    unit_no?: string,
    total_amount?: number,
    final_amount?: number,
    f_1?: boolean,
    description?: string,
    internal_remark?: string,
    completion_day?: number,
    tenure?: number,
    bonus?: {
        description?: string,
        value?: number | string,
    },
    status?: string,
    released_at?: string;
    confirmed_at?: string;
    metadata?: string | Package[],
    created_by?: User;
    updated_by?: User;
    created_at?: string;
    updated_at?: string;
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
    version?: number,
    packages?: Package[],
    bonus?: {
        description?: string,
        value?: number | string,
    },
    metadata?: string,
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
    purchase_orders?: PurchaseOrder[],
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
    item_id?: string,
    item_type?: string,
    sale?: Sale,
    po?: PurchaseOrder,
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
    payment_channel?: string,
    payment_date?: string,
    bank?: string,
    receiving_account?: string,
    remark?: string,
    attachments?: Attachment[] | File[],
    currency?: string,
    description?: string,
    status?: string,
    created_at?: string,
    updated_at?: string,
}

export interface QuotationRequestForm {
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
        quest_1?: string | number;
        quest_2?: string | number;
        quest_3?: string;
        quest_4?: string;
        quest_5?: string;
        quest_6?: string;
        quest_7?: string;
        quest_8?: string;
    }
    status?: string;
    furnishing?: {
        [key: string]: {
            [key: string]: string | undefined;
        } | {
            [bedroom: string]: {
                [key: string]: string | undefined;
            };
        } | {
            [bathroom: string]: {
                [key: string]: string | undefined;
            };
        };
        foyer_entrance?: {
            grille_door?: string;
            digital_lock?: string;
            shoe_cabinet?: string;
            lights?: string;
            other?: string;
        };
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
        bedrooms?: {
            [bedroom: string]: {
                bedframe?: string,
                wardrobe?: string,
                study_table?: string,
                writing_chair?: string,
                curtain?: string,
                lights?: string,
                fan?: string,
                ac?: string,
                other?: string,
                remark?: string,
            }
        },
        bathrooms?: {
            [bathroom: string]: {
                water_heater?: string,
                bidet?: string,
                mirror?: string,
                shower_screen?: string,
                lights?: string,
                other?: string,
                remark?: string,
            }
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

export interface InvestorInterest {
    id?: string;
    status?: "new" | "reviewed" | "contacted" | "closed";
    full_name?: string;
    email: string;
    mobile_number: string;
    property_name: string;
    unit_type: string;
    units_owned: string;
    keys_collected: string;
    concerns: string[];
    rental_strategy: string[];
    expected_rental_return: string;
    investment_goals: string[];
    support_needed: string[];
    preferred_contact: string;
    preferred_time: string;
    created_at?: string,
    updated_at?: string,
}

export interface DefectInspectionForm {
    id?: string;
    reno_progress_id?: string;
    di_by?: string;
    date?: string;
    time?: string;
    owner_email?: string;
    property?: {
        id?: string;
        property_name?: string;
        other_property_name?: string;
        block?: string;
        level?: string;
        unit?: string;
    };
    reno_progress?: RenoProgress;
    contractor_name?: string;
    contractor_email?: string;
    bedroom_count?: string | number;
    bathroom_count?: string | number;
    area?: {
        foyer?: {
            [key: string]: FormQuestion | undefined; // Add index signature
            q1?: FormQuestion;
            q2?: FormQuestion;
            q3?: FormQuestion;
            q4?: FormQuestion;
        };
        kitchen?: {
            [key: string]: FormQuestion | undefined; // Add index signature
            q1?: FormQuestion;
            q2?: FormQuestion;
            q3?: FormQuestion;
            q4?: FormQuestion;
            q5?: FormQuestion;
            q6?: FormQuestion;
            q7?: FormQuestion;
            q8?: FormQuestion;
        };
        yard?: {
            [key: string]: FormQuestion | undefined; // Add index signature
            q1?: FormQuestion;
            q2?: FormQuestion;
            q3?: FormQuestion;
            q4?: FormQuestion;
            q5?: FormQuestion;
            q6?: FormQuestion;
        };
        living?: {
            [key: string]: FormQuestion | undefined; // Add index signature
            q1?: FormQuestion;
            q2?: FormQuestion;
            q3?: FormQuestion;
            q4?: FormQuestion;
            q5?: FormQuestion;
            q6?: FormQuestion;
            q7?: FormQuestion;
            q8?: FormQuestion;
            q9?: FormQuestion;
        };
        balcony?: {
            [key: string]: FormQuestion | undefined; // Add index signature
            q1?: FormQuestion;
            q2?: FormQuestion;
            q3?: FormQuestion;
            q4?: FormQuestion;
        };
        hallway?: {
            [key: string]: FormQuestion | undefined; // Add index signature
            q1?: FormQuestion;
            q2?: FormQuestion;
            q3?: FormQuestion;
            q4?: FormQuestion;
        };
        bedrooms?: {
            [bedroom: string]: {
                [key: string]: FormQuestion | undefined; // Add index signature
                q1?: FormQuestion;
                q2?: FormQuestion;
                q3?: FormQuestion;
                q4?: FormQuestion;
                q5?: FormQuestion;
                q6?: FormQuestion;
                q7?: FormQuestion;
                q8?: FormQuestion;
                q9?: FormQuestion;
            };
        };
        bathrooms?: {
            [bathroom: string]: {
                [key: string]: FormQuestion | undefined; // Add index signature
                q1?: FormQuestion;
                q2?: FormQuestion;
                q3?: FormQuestion;
                q4?: FormQuestion;
                q5?: FormQuestion;
                q6?: FormQuestion;
                q7?: FormQuestion;
                q8?: FormQuestion;
                q9?: FormQuestion;
            };
        };
    };
    status?: string;
    report_hash?: string;
    link_status?: 'unactive' | 'active';
    submitted_at?: string;
    created_by?: User;
    updated_by?: User;
    created_at?: string;
    updated_at?: string;
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
        [key: string]: any; // Add index signature to allow dynamic key access
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
    label?: string;
    value?: string;
    attachments?: Attachment[]; // Change to array of Attachment
    remark?: string;
}

export interface Attachment {
    id?: string;
    original_name?: string;
    file_url?: string;
    file?: File;
    size?: number;
}

export interface RenoProgress {
    id?: string,
    sale_id?: string,
    sales_no?: string,
    sale?: Sale,
    completion?: {
        jobs?: {
            job_id: number;
            job_name: string;
            completion_percentage: number;
        }[];
        overall_completion?: number;
    }
    phases?: ProgressPhase[],
    property?: {
        id?: string,
        name?: string
        block?: string,
        floor?: string,
        unit_no?: string,
    }
    defect_inspection_form?: DefectInspectionForm,
    key_management?: KeyManagement,
    user?: User,
    status?: string,
    rpm_jobs?: RPMJob[],
    contractual_start_date?: string,
    contractual_end_date?: string,
    contractual_p1_start_date?: string,
    contractual_p1_end_date?: string,
    contractual_p2_end_date?: string,
    contractual_p2_start_date?: string,
    contractual_qc_end_date?: string,
    contractual_qc_start_date?: string,
    contractual_pc_end_date?: string,
    contractual_pc_start_date?: string,
    contractual_handover_date?: string,
    contractor_start_date?: string,
    contractor_end_date?: string,
    contractor_p1_start_date?: string,
    contractor_p1_end_date?: string,
    contractor_p2_end_date?: string,
    contractor_p2_start_date?: string,
    contractor_qc_end_date?: string,
    contractor_qc_start_date?: string,
    contractor_pc_end_date?: string,
    contractor_pc_start_date?: string,
    contractor_handover_date?: string,
    progress?: {
        pre_reno_1?: number,
        pre_reno_2?: {
            pre_reno_2_1?: number,
            pre_reno_2_2?: number,
            pre_reno_2_3?: number,
        },
        pre_reno_3?: {
            pre_reno_3_1?: number,
            pre_reno_3_2?: number,
            pre_reno_3_3?: number,
            pre_reno_3_4?: number,
        },
        p1_1?: number,
        p1_2?: number,
        p1_3?: number,
    },
    pre_reno_completion?: number,
    p1_completion?: number,
    p2a_completion?: number,
    p2b_completion?: number,
    iot_completion?: number,
    post_reno_completion?: number,
    date_management?: {
        sales_date?: string,
        defect_permit_date?: string,
        p1_date?: string,
        p2a_date?: string,
        p2b_date?: string,
        qc_date?: string,
        cleaning_date?: string,
        ch_date?: string,
        oh_date?: string,
    }
    total_amount?: number,
    paid_amount?: number,
    remaining_percentage?: number,
    paid_percentage?: number,
    resource_id?: string,
    resource_item_id?: string,
    resourceItem?: ResourceItem,
    permission_id?: string;
    permissions?: User[],
    defect_updated_at?: string,
    permit_updated_at?: string,
    completed_at?: string,
    rpm_version?: number,
    sent_to_lark_date?: string,
    rpm_acknowledge_status?: string,
    is_converted?: boolean,
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
    completion?: number,
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
    area?: string,
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
    is_key_form?: boolean,
    is_visible?: boolean,
    status?: string,
    owner_comment?: string,
    internal_comment?: string,
    completed_at?: string,
    created_at?: string,
    updated_at?: string,
    created_by?: User;
    updated_by?: User;
}

export interface RPMJob {
    id?: string,
    reno_progress_id?: string,
    job_category?: string,
    name?: string,
    status?: string,
    rpm_tasks?: RPMTask[],
}

export interface RPMTask {
    id?: string,
    job_id?: string,
    job?: RPMJob,
    task_qc?: RPMTaskQC[],
    space_type?: string,
    room_name?: string,
    item_name?: string,
    priority?: number,
    task_weightage?: number,
    sequence?: number,
    is_visible?: boolean,
    internal_comment?: string,
    owner_comment?: string,
    internal_attachments?: Attachment[],
    owner_attachments?: Attachment[],
    status?: string,
    qc_task?: RPMTaskQC,
    completed_at?: string,
    created_at?: string,
    updated_at?: string,
    created_by?: User;
    updated_by?: User;
}

export interface RPMTaskQC {
    id?: string,
    task_id?: string,
    task?: RPMTask,
    is_visible?: boolean,
    internal_comment?: string,
    owner_comment?: string,
    internal_attachments?: Attachment[],
    owner_attachments?: Attachment[],
    status?: string,
    completed_at?: string,
    created_at?: string,
    updated_at?: string,
    created_by?: User;
    updated_by?: User;
}

export interface RenoAccetanceForm {
    id?: string,
    reno_progress_id?: string,
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
    po_packages?: POPackage[],
    invoices?: Invoice[],
    total_amount?: number,
    remaining_amount?: number,
    remaining_percentage?: number,
    paid_percentage?: number,
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

export interface POPackage {
    id?: string,
    po_id?: string,
    package_id?: string,
    name?: string,
    description?: string,
    description_internal?: string,
    category?: string,
    quantity?: number,
    total_price?: number,
    status?: string,
    sequence?: number,
    po_items?: POItem[],
    created_by?: string,
    updated_by?: string,
    created_at?: string,
    updated_at?: string,
}

export interface POItem {
    id?: string,
    po_package_id?: string,
    product_id?: string,
    product_name?: string,
    product_desc?: string,
    qty?: number,
    uom?: string,
    supply?: boolean,
    install?: boolean,
    unit_price?: number,
    supply_price?: number,
    install_price?: number,
    total_price?: number,
    status?: string,
    sequence?: number,
    shipping_date?: string,
    shipped_date?: string,
    delivery_date?: string,
    delivered_date?: string,
    created_by?: string,
    updated_by?: string,
}

export interface KeyManagement {
    id?: string,
    reno_progress_id?: string,
    date_received_key?: string,
    date_posted?: string,
    pic_name?: string,
    status?: string,
    metadata?: Array<{
        name: string,
        value: Array<{
            name?: string,
            remark?: string,
            attachment?: Attachment,
        }>
        remark?: string,
        quantity?: number  // Added quantity field
    }>,
    created_by?: User,
    updated_by?: User,
    created_at?: string,
    updated_at?: string,
}

export interface OTPRequest {
    id?: string,
    mobile?: string,
    code?: string,
    status?: string,
    uuid?: string,
    sms_id?: string,
    expires_at?: number,
    created_at?: number,
    updated_at?: number,
}