import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createOrder, fetchOrder, fetchProperties, fetchProperty, fetchRegistrationForm, fetchUser, fetchUsers } from "../../services/api";
import { Order, QuotationRequestForm, Property, User, Package, Quotation, OrderQuotation } from "../../types";
import { KTAccordion, KTTooltip } from "../../metronic/core";
import { Slide, toast } from "react-toastify";
import Loading from "../../components/Loading";
import InputFieldGroup from "../../components/Forms/TextFields/InputFieldGroup";
import IncludeOrderQuotationPackageModal from "../../components/Modals/IncludeOrderQuotationPackageModal";
import IncludeQuotationProductModal from "../../components/Modals/IncludeQuotationProductModal";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortablePackage } from "./components/SortablePackage";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "others", label: "Others" },
];

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null;

function CreateOrder() {
    const navigate = useNavigate();
    const location = useLocation();
    const qtyBtnRef = useRef(null);

    const queryParams = new URLSearchParams(location.search);
    const formId = queryParams.get("formId");
    const duplicateOrderId = queryParams.get("dp");

    const [searchUserTerm, setSearchUserTerm] = useState("");
    const [searchPropertyTerm, setSearchPropertyTerm] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPackages, setSelectedPackages] = useState<Package[]>([]);
    const [formDetail, setFormDetail] = useState<QuotationRequestForm | null>(null);
    const [loading, setLoading] = useState(false);

    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number; cogs: number; quantity: number }[]>([]);
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0);

    const inputUserRef = useRef(null);
    const inputPropertyRef = useRef(null);

    const [formData, setFormData] = useState({
        userId: "",
        propertyId: "",
        quotationId: "",
        totalAmount: 0,
        finalAmount: 0,
        completion_day: 0,
        unit_type: "",
        block: "",
        floor: "",
        unitNo: "",
        status: "",
        isFinalAmountEnable: false,
        isDraftMode: false,
        single_bedroom_count: 1,
        queen_bedroom_count: 1,
        studio_count: 0,
        bathroom_count: 1,
        include_partition: false,
        is_progressive_payment: true,
        internal_remark: "",
        bonus: { description: "", value: "" },
    });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [selectedQuotation, setSelectedQuotation] = useState<OrderQuotation | null>(null);
    const [selectedPackageId, setSelectedPackageId] = useState("");

    const notify = (type: "success" | "error", message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem("theme"),
            transition: Slide,
        });
    };


    const handleSelectCustomQuotation = () => {
        setFormData((prev) => ({ ...prev, quotationId: "0", totalAmount: 0 }));
        setSelectedQuotation({ id: "0", quotation_name: "Custom Quotation", total_amount: 0, metadata: null });
        setSelectedPackages([]);
        notify("success", "Custom quotation added.");
    };

    useEffect(() => {
        document.title = "Create Quotation Order | RenoXpert";

        const sessionData = localStorage.getItem("create_order_data");

        if (formId) handleSearchForm(formId);
        if (duplicateOrderId) handleDuplicateOrder(duplicateOrderId);
        if (sessionData) {
            const parsedSessionData = JSON.parse(sessionData);
            setFormData(parsedSessionData);

            if (parsedSessionData.userId) handleSelectUserById(parsedSessionData.userId);
            if (parsedSessionData.propertyId) handleSelectPropertytById(parsedSessionData.propertyId);
            if (parsedSessionData.quotationId) {
                if (parsedSessionData.quotationId === "0") handleSelectCustomQuotation();
            }
            if (parsedSessionData.totalAmount) {
                setFormData((prev) => ({ ...prev, totalAmount: parsedSessionData.totalAmount }));
            }
        }
    }, [formId]);

    useEffect(() => {
        if (selectedPackages.length > 0) recalculateTotalAmount();
        else setFormData((prev) => ({ ...prev, totalAmount: 0 }));

        if (!selectedPackages) return;

        let addonCounter = 0; // To number each add-on uniquely

        const packages: Package[] = selectedPackages;

        const categoryTotals = packages.reduce((acc, quotationPackage) => {
            let category;
            if (quotationPackage.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter} (${quotationPackage.name})`;
            } else {
                category = quotationPackage.category;
            }

            const categoryData = quotationPackage.products.reduce(
                (data, product) => {
                    // Calculate retail prices (existing logic)
                    let supplyPrice = 0;
                    if (product.pivot.includeSupply) {
                        supplyPrice = (product.provisioning.supply.retail_price * product.pivot.quantity) || 0;
                    } else {
                        supplyPrice = (product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price) || 0;
                    }

                    let installPrice = 0;
                    if (product.pivot.includeInstall) {
                        installPrice = (product.provisioning.install.retail_price * product.pivot.quantity) || 0;
                    } else {
                        installPrice = (product.provisioning.install.retail_price - product.provisioning.install.excluded_price) || 0;
                    }

                    // Calculate COGS
                    let supplyCogs = 0;
                    if (product.pivot.includeSupply) {
                        supplyCogs = (product.provisioning.supply.cogs * product.pivot.quantity) || 0;
                    }

                    let installCogs = 0;
                    if (product.pivot.includeInstall) {
                        installCogs = (product.provisioning.install.cogs * product.pivot.quantity) || 0;
                    }

                    return {
                        total_price: data.total_price + supplyPrice + installPrice,
                        cogs: data.cogs + supplyCogs + installCogs,
                    };
                },
                { total_price: 0, cogs: 0 }
            );

            const categoryTotalPrice = categoryData.total_price * (quotationPackage.quantity || 1);
            const categoryCogs = categoryData.cogs * (quotationPackage.quantity || 1);

            if (!(quotationPackage.is_addon === true && quotationPackage.is_addon_included === false)) {
                if (!acc[category]) {
                    acc[category] = { total_price: 0, cogs: 0, quantity: 0 };
                }
                acc[category].total_price += categoryTotalPrice;
                acc[category].cogs += categoryCogs;
                acc[category].quantity += quotationPackage.quantity;
            }

            return acc;
        }, {} as Record<string, { total_price: number; cogs: number; quantity: number }>);
        

        // Calculate filtered total_amount (based on total_price)
        const filteredTotalAmount = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0);

        // Calculate total COGS
        const filteredTotalCogs = Object.values(categoryTotals).reduce((sum, { cogs }) => sum + cogs, 0);

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, cogs, quantity }]) => ({
            category: category.startsWith('Add-on Option')
                ? category
                : categoryOptions.find(option => option.value === category)?.label || category,
            total_price,
            cogs,
            quantity,
        }));

        const sortedCategories = [
            ...categoriesArray.filter(item => !item.category.startsWith('Add-on Option')),
            ...categoriesArray.filter(item => item.category.startsWith('Add-on Option')),
        ];

        const totalAmount = formData.finalAmount > 0 ? formData.finalAmount : selectedPackages.reduce((total, pkg) => {
            // Skip if package is not an addon or not included
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return total;
            }

            // Use final_amount if available, otherwise use total_price
            return total + (pkg.total_price * (pkg.quantity || 1));
        }, 0);

        setTotalExcludedAddonAmount(totalAmount);

        setPackageCategories(sortedCategories);

    }, [selectedPackages]);

    const handleOpenOwnerDropdown = async () => {
        setSearchUserTerm("");
        inputUserRef.current.value = "";
        inputUserRef.current.focus();
        try {
            const data = await fetchUsers("", "owner");
            setUsers(data.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const handleOpenPropertyDropdown = async () => {
        setSearchPropertyTerm("");
        inputPropertyRef.current.value = "";
        inputPropertyRef.current.focus();
        try {
            const data = await fetchProperties("", 6);
            setProperties(data.data);
        } catch (error) {
            console.error("Failed to fetch properties:", error);
        }
    };

    const handleSearchForm = async (formId: string) => {
        setLoading(true);
        try {
            const response = await fetchRegistrationForm(Number(formId));
            const registrationForm: QuotationRequestForm = response.data.data;

            if (registrationForm) {
                setFormDetail(registrationForm);
                const userResponse = await fetchUser(Number(registrationForm.user.id));
                const user: User = userResponse.data;
                const propertyResponse = await fetchProperty(Number(registrationForm.property.id));
                const property: Property = propertyResponse.data;

                if (user) handleSelectUserById(Number(user.id));
                if (property) handleSelectPropertytById(Number(property.id));

                setFormData((prevData) => ({
                    ...prevData,
                    block: registrationForm.property.block,
                    floor: registrationForm.property.level,
                    unitNo: registrationForm.property.unit,
                    // bedroom_count: Number(registrationForm.questions.quest_1),
                    bathroom_count: Number(registrationForm.questions.quest_2),
                }));
            } else {
                toast.error("Registration form not found");
            }
        } catch (error) {
            console.error("Error fetching registration form:", error);
            toast.error("Failed to fetch registration form");
        }
        setLoading(false);
    };

    const handleDuplicateOrder = async (orderId: string) => {
        setLoading(true);
        try {
            const response = await fetchOrder(Number(orderId));
            if (response?.success) {
                setFormData((prev) => ({
                    ...prev,
                    propertyId: response.data.property_id || "",
                    unit_type: response.data.unit_type || "",
                    quotationId: "0",
                    totalAmount: response.data.latest_quotation.total_amount || 0,
                    finalAmount: response.data.final_amount || 0,
                    isFinalAmountEnable: response.data.latest_quotation.final_amount ? true : false,
                    isDraftMode: response.data.user ? false : true,
                    completion_day: response.data.completion_day || 1,
                    include_partition: response.data.include_partition ? true : false,
                    is_progressive_payment: response.data.is_progressive_payment ? true : false,
                    internal_remark: response.data.internal_remark || "",
                    // bedroom_count: response.data.bedroom_count,
                    single_bedroom_count: response.data.single_bedroom_count,
                    queen_bedroom_count: response.data.queen_bedroom_count,
                    studio_count: response.data.studio_count,
                    bathroom_count: response.data.bathroom_count,
                    bonus: {
                        description: response.data.latest_quotation.bonus?.description || "",
                        value: response.data.latest_quotation.bonus?.value.toString() || "",
                    },
                }));
                if (response.data.property_id) setSelectedProperty(response.data.property);
                setSelectedQuotation({
                    id: "0",
                    quotation_name: "Custom Quotation",
                    total_amount: response.data.latest_quotation.total_amount,
                    metadata: null,
                });
                setSelectedPackages(response.data.latest_quotation.packages);
            }
        } catch (error) {
            notify("error", "Failed to fetch order");
        }
        setLoading(false);
    };

    const handleToggleDraftMode = () => {
        setFormData((prev) => ({
            ...prev,
            userId: "",
            isDraftMode: !prev.isDraftMode,
        }));
        setSelectedUser(null);
        setSearchUserTerm("");
        setUsers([]);
    };

    const handleBackClick = () => {
        navigate(LOCAL_PATH_PREFIX + "orders");
    };

    const handleSearchUser = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchUserTerm(term);
        try {
            const data = await fetchUsers(term, "owner");
            setUsers(data.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleSearchProperty = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchPropertyTerm(term);
        try {
            const data = await fetchProperties(term, 6);
            setProperties(data.data);
        } catch (error) {
            console.error("Error fetching properties:", error);
        }
    };

    const handleSelectUser = async (user: User) => {
        setFormData((prev) => ({ ...prev, userId: user.id, isDraftMode: false }));
        setSelectedUser(user);
        setSearchUserTerm("");
        setUsers([]);
    };

    const handleSelectProperty = async (property: Property) => {
        setFormData((prev) => ({ ...prev, propertyId: property.id }));
        setSelectedProperty(property);
        setSearchPropertyTerm("");
        setProperties([]);
    };

    const handleSelectUserById = async (id: number) => {
        try {
            const data = await fetchUser(id);
            setFormData((prev) => ({ ...prev, userId: data.data.id }));
            setSelectedUser(data.data);
            setSearchUserTerm("");
            setUsers([]);
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const handleSelectPropertytById = async (id: number) => {
        try {
            const data = await fetchProperty(id);
            if (data) {
                setFormData((prev) => ({ ...prev, propertyId: data.data.id }));
                setSelectedProperty(data.data);
                setSearchPropertyTerm("");
                setProperties([]);
            }
        } catch (error) {
            console.error("Error fetching property:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith("bonus.")) {
            const bonusField = name.split(".")[1];
            const newValue = bonusField === "value" ? Number(value) : value;
            setFormData((prevData) => ({
                ...prevData,
                bonus: { ...prevData.bonus, [bonusField]: newValue },
            }));
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    const toggleEnableFinalAmount = () => {
        setFormData((prev) => ({ ...prev, isFinalAmountEnable: !prev.isFinalAmountEnable }));
    };

    const handleSubmit = async () => {
        setLoading(true);

        if (!formData.isDraftMode) {
            if (!selectedUser) {
                notify("error", "Please select a user.");
                setLoading(false);
                return;
            }
            if (!selectedProperty) {
                notify("error", "Please select a property.");
                setLoading(false);
                return;
            }
            if (!formData.block || !formData.floor || !formData.unitNo) {
                notify("error", "Please enter block, floor and unit no.");
                setLoading(false);
                return;
            }
        }

        if (!selectedQuotation) {
            notify("error", "Please select a quotation.");
            setLoading(false);
            return;
        }

        if (formData.bonus?.value != null) {
            formData.bonus.value = formData.bonus.value.toString();
        }

        const newOrder: Order = {
            user_id: selectedUser?.id || "",
            form_id: formId,
            property_id: selectedProperty?.id || "",
            quotation_id: selectedQuotation.id,
            total_amount: formData.totalAmount
                ? formData.totalAmount - (Number(formData.bonus?.value) || 0)
                : selectedQuotation.total_amount - (Number(formData.bonus?.value) || 0),
            final_amount: formData.isFinalAmountEnable ? formData.finalAmount : null,
            unit_type: formData.unit_type,
            block: formData.block,
            floor: formData.floor,
            unit_no: formData.unitNo,
            // bedroom_count: formData.bedroom_count,
            single_bedroom_count: formData.single_bedroom_count,
            queen_bedroom_count: formData.queen_bedroom_count,
            studio_count: formData.studio_count,
            bathroom_count: formData.bathroom_count,
            include_partition: formData.include_partition,
            is_progressive_payment: formData.is_progressive_payment,
            description: "",
            internal_remark: formData.internal_remark,
            completion_day: formData.completion_day,
            bonus: formData.bonus,
            metadata: selectedPackages ? JSON.stringify(selectedPackages) : undefined,
        };

        try {
            const response = await createOrder(newOrder);
            if (response?.success) {
                notify("success", "Order Created Successfully!");
                navigate(LOCAL_PATH_PREFIX + "orders/" + response.data.id);
            }
        } catch (error) {
            notify("error", error.response.data.data);
        }
        setLoading(false);
    };

    const openAddPackageModal = () => {
        const datatableEl = document.querySelector("#packages_table") as HTMLElement;
        if (datatableEl) {
            const datatable = (datatableEl as any).instance;
            if (datatable) datatable.reload();
        }
    };

    const openAddProductModal = (event: React.MouseEvent<HTMLButtonElement>) => {
        const id = event.currentTarget.getAttribute("data-id");
        const selectedPackage = selectedPackages.find((pkg) => pkg.id === Number(id));
        if (selectedPackage) {
            setSelectedPackageId(selectedPackage.id.toString());
            const datatableEl = document.querySelector("#products_table") as HTMLElement;
            if (datatableEl) {
                const datatable = (datatableEl as any).instance;
                if (datatable) datatable.reload();
            }
        } else {
            console.log("Package not found");
        }
    };

    const toggleProperty = (id: number, packId: number, property: "supply" | "install") => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.map((product) => {
                        if (product.id === id) {
                            const key = property === "install" ? "includeInstall" : "includeSupply";
                            const updatedPivot = {
                                ...product.pivot,
                                [key]: product.pivot ? !product.pivot[key] : true,
                            };
                            if (!updatedPivot.includeSupply && !updatedPivot.includeInstall) {
                                updatedPivot.quantity = 1;
                            }
                            return { ...product, pivot: updatedPivot };
                        }
                        return product;
                    });

                    const packageTotalPrice = updatedProducts.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );

                    let newTotalPrice = packageTotalPrice;
                    updatedProducts.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            newTotalPrice -= product.provisioning.supply.excluded_price * product.pivot.quantity;
                        }
                        if (!product.pivot.includeInstall) {
                            newTotalPrice -= product.provisioning.install.excluded_price * product.pivot.quantity;
                        }
                    });

                    return { ...prodPackage, products: updatedProducts, total_price: newTotalPrice };
                }
                return prodPackage;
            });
            return updatedPackages;
        });
        recalculateTotalAmount();
    };

    const adjustQuantity = (prodId: number, packId: number, action: "increase" | "decrease") => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.map((product) => {
                        if (product.id === prodId) {
                            if (
                                product.pivot.quantity === 1 &&
                                action === "increase" &&
                                !product.pivot.includeSupply &&
                                !product.pivot.includeInstall
                            ) {
                                return {
                                    ...product,
                                    pivot: { ...product.pivot, includeSupply: true, includeInstall: true },
                                };
                            }
                            if (!product.pivot.includeSupply && !product.pivot.includeInstall) return product;
                            if (action === "decrease" && product.pivot.quantity === 1) {
                                return {
                                    ...product,
                                    pivot: { ...product.pivot, includeSupply: false, includeInstall: false },
                                };
                            }
                            const newQty =
                                action === "increase"
                                    ? product.pivot.quantity + 1
                                    : Math.max(1, product.pivot.quantity - 1);
                            return { ...product, pivot: { ...product.pivot, quantity: newQty } };
                        }
                        return product;
                    });

                    const packageTotalPrice = updatedProducts.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );

                    let newTotalPrice = packageTotalPrice;
                    updatedProducts.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            newTotalPrice -= product.provisioning.supply.excluded_price * product.pivot.quantity;
                        }
                        if (!product.pivot.includeInstall) {
                            newTotalPrice -= product.provisioning.install.excluded_price * product.pivot.quantity;
                        }
                    });

                    return { ...prodPackage, products: updatedProducts, total_price: newTotalPrice };
                }
                return prodPackage;
            });
            return updatedPackages;
        });
        recalculateTotalAmount();
    };

    const adjustPackageQuantity = (packId: number, action: "increase" | "decrease") => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const newQuantity =
                        action === "increase" ? prodPackage.quantity + 1 : Math.max(1, prodPackage.quantity - 1);
                    let packageTotalPrice = prodPackage.products.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );
                    prodPackage.products.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            packageTotalPrice -= product.provisioning.supply.excluded_price * product.pivot.quantity;
                        }
                        if (!product.pivot.includeInstall) {
                            packageTotalPrice -= product.provisioning.install.excluded_price * product.pivot.quantity;
                        }
                    });
                    return { ...prodPackage, total_price: packageTotalPrice, quantity: newQuantity };
                }
                return prodPackage;
            });
            return updatedPackages;
        });
        recalculateTotalAmount();
    };

    const handleRemoveProduct = (packId: number, prodId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage: Package) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.filter((product) => product.id !== prodId);
                    const newTotalPrice = updatedProducts.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );
                    return { ...prodPackage, products: updatedProducts, total_price: newTotalPrice };
                }
                return prodPackage;
            });
            return updatedPackages;
        });
        recalculateTotalAmount();
    };

    const handleRemovePackage = (packId: number) => {
        setSelectedPackages((prevPackages: Package[]) =>
            prevPackages.filter((prodPackage: Package) => prodPackage.id !== packId)
        );
        recalculateTotalAmount();
    };

    const toggleIsAddonIncluded = (packId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage: Package) => {
                if (prodPackage.id === packId) {
                    return { ...prodPackage, is_addon_included: !prodPackage.is_addon_included };
                }
                return prodPackage;
            })

            return updatedPackages
        })
    }

    const recalculateTotalAmount = () => {
        const newTotal = selectedPackages.reduce((sum, pkg) => {
            // Skip adding to sum if package is an addon and not included
            if (pkg.is_addon && !pkg.is_addon_included) {
                return sum; // Return the current sum unchanged
            }

            // Otherwise, calculate the package total as before
            sum +=
                pkg.products.reduce((prodSum, product) => {
                    if (!product.pivot.includeSupply) {
                        prodSum +=
                            product.provisioning.supply.retail_price * product.pivot.quantity -
                            product.provisioning.supply.excluded_price * product.pivot.quantity;
                    } else {
                        prodSum += product.provisioning.supply.retail_price * product.pivot.quantity;
                    }
                    if (!product.pivot.includeInstall) {
                        prodSum +=
                            product.provisioning.install.retail_price * product.pivot.quantity -
                            product.provisioning.install.excluded_price * product.pivot.quantity;
                    } else {
                        prodSum += product.provisioning.install.retail_price * product.pivot.quantity;
                    }
                    return prodSum;
                }, 0) * (pkg.quantity || 1);

            return sum;
        }, 0);

        setFormData((prev) => ({ ...prev, totalAmount: newTotal }));
        return newTotal;
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        if (active.id.toString().startsWith("package-") && over.id.toString().startsWith("package-")) {
            const oldIndex = selectedPackages.findIndex((pkg) => `package-${pkg.id}` === active.id);
            const newIndex = selectedPackages.findIndex((pkg) => `package-${pkg.id}` === over.id);
            const newPackages = arrayMove(selectedPackages, oldIndex, newIndex);
            setSelectedPackages(newPackages);
        } else if (active.id.toString().startsWith("product-") && over.id.toString().startsWith("product-")) {
            const activeParts = active.id.toString().split("-");
            const overParts = over.id.toString().split("-");
            const activePackId = parseInt(activeParts[2]);
            const overPackId = parseInt(overParts[2]);

            if (activePackId === overPackId) {
                setSelectedPackages((prevPackages) => {
                    const updatedPackages = prevPackages.map((pkg) => {
                        if (pkg.id === activePackId) {
                            const oldIndex = pkg.products.findIndex(
                                (prod) => `product-${prod.id}-${pkg.id}` === active.id
                            );
                            const newIndex = pkg.products.findIndex(
                                (prod) => `product-${prod.id}-${pkg.id}` === over.id
                            );
                            const newProducts = arrayMove(pkg.products, oldIndex, newIndex);
                            return { ...pkg, products: newProducts };
                        }
                        return pkg;
                    });
                    return updatedPackages;
                });
            }
        }
    };

    return (
        <>
            {loading && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-6 lg:mr-[400px] lg:pr-6">
                <div className="flex gap-4 items-center">
                    <button className="text-gray-800 dark:text-gray-400" onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">New Order</span>
                </div>
                <div className="flex items-center">
                    <label className="switch switch-lg">
                        <input
                            className="checkbox"
                            name="isDraftMode"
                            type="checkbox"
                            checked={!!formData.isDraftMode}
                            onChange={handleToggleDraftMode}
                        />
                        <span className="switch-label">Draft Mode</span>
                    </label>
                </div>
            </div>

            <div className="flex grow flex-col gap-3 lg:gap-6 lg:mr-[400px] lg:pr-6">
                <div className="flex flex-col gap-8 mb-8" data-accordion="true" data-accordion-expand-all="true">
                    <div className="card shadow-sm">
                        <div className="card-body p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Owner Section */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-base font-semibold text-gray-900">Select an Owner</span>
                                        <span className="text-xs text-blue-600">
                                            Selecting an owner will disable Draft Mode
                                        </span>
                                        <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click" id="owner_dropdown">
                                            <button
                                                className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                                onClick={handleOpenOwnerDropdown}
                                            >
                                                <span>Owner</span>
                                                <i className="ki-filled ki-down"></i>
                                            </button>
                                            <div className="dropdown-content w-full max-w-80">
                                                <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                                    <label className="input input-sm">
                                                        <i className="ki-filled ki-magnifier"></i>
                                                        <input
                                                            ref={inputUserRef}
                                                            placeholder="Search Owner"
                                                            type="text"
                                                            value={searchUserTerm}
                                                            onChange={handleSearchUser}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="menu menu-default flex flex-col w-full">
                                                    {users.map((user, index) => (
                                                        <div className="menu-item" key={index} data-id={user.id}>
                                                            <button className="menu-link" onClick={() => handleSelectUser(user)}>
                                                                <span className="menu-title">{user.name}</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedUser && (
                                            <div className="card bg-gray-50 p-4 rounded-md">
                                                <div className="flex flex-col gap-1 text-gray-900">
                                                    <span className="text-sm font-semibold">{selectedUser.name}</span>
                                                    <span className="text-sm text-gray-500">{selectedUser.email}</span>
                                                    <span className="text-sm">
                                                        +{selectedUser.country_code} {selectedUser.phone_no}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-base font-semibold text-gray-900">Internal Remark</span>
                                        <textarea
                                            className="textarea w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            name="internal_remark"
                                            id="internal_remark"
                                            rows={4}
                                            value={formData.internal_remark}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Property Section */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-base font-semibold text-gray-900">Select a Property</span>
                                        <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click" id="property_dropdown">
                                            <button
                                                className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                                onClick={handleOpenPropertyDropdown}
                                            >
                                                <span>Property</span>
                                                <i className="ki-filled ki-down"></i>
                                            </button>
                                            <div className="dropdown-content w-full max-w-80">
                                                <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                                    <label className="input input-sm">
                                                        <i className="ki-filled ki-magnifier"></i>
                                                        <input
                                                            ref={inputPropertyRef}
                                                            placeholder="Search property"
                                                            type="text"
                                                            value={searchPropertyTerm}
                                                            onChange={handleSearchProperty}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="menu menu-default flex flex-col w-full">
                                                    {properties.map((property, index) => (
                                                        <div className="menu-item" key={index} data-id={property.id}>
                                                            <button
                                                                className="menu-link"
                                                                onClick={() => handleSelectProperty(property)}
                                                            >
                                                                <span className="menu-title">{property.name}</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedProperty && (
                                            <div className="card bg-gray-50 p-4 rounded-md">
                                                <div className="flex flex-col gap-1 text-gray-900">
                                                    <span className="text-sm font-semibold">{selectedProperty.name}</span>
                                                    <span className="text-sm text-gray-500">
                                                        {[
                                                            selectedProperty.address,
                                                            selectedProperty.street,
                                                            selectedProperty.postcode,
                                                            selectedProperty.city,
                                                            selectedProperty.state,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(", ")}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {selectedProperty && (
                                        <div className="flex flex-col gap-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Unit Type</span>
                                                    <input
                                                        className="input p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        type="text"
                                                        name="unit_type"
                                                        value={formData.unit_type}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Block</span>
                                                    <input
                                                        className="input p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        type="text"
                                                        name="block"
                                                        value={formData.block}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Floor</span>
                                                    <input
                                                        className="input p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        type="text"
                                                        name="floor"
                                                        value={formData.floor || ""}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Unit No</span>
                                                    <input
                                                        className="input p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        type="text"
                                                        name="unitNo"
                                                        value={formData.unitNo}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Queen Bedroom</span>
                                                    <select
                                                        className="select p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        name="queen_bedroom_count"
                                                        id="queen_bedroom_count"
                                                        onChange={handleChange}
                                                        value={formData.queen_bedroom_count}
                                                    >
                                                        <option value="0">0</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5">5</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Single Bedroom</span>
                                                    <select
                                                        className="select p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        name="single_bedroom_count"
                                                        id="single_bedroom_count"
                                                        onChange={handleChange}
                                                        value={formData.single_bedroom_count}
                                                    >
                                                        <option value="0">0</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5">5</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Studio Room</span>
                                                    <select
                                                        className="select p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        name="studio_count"
                                                        id="studio_count"
                                                        onChange={handleChange}
                                                        value={formData.studio_count}
                                                    >
                                                        <option value="0">0</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Bathroom</span>
                                                    <select
                                                        className="select p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        name="bathroom_count"
                                                        id="bathroom_count"
                                                        onChange={handleChange}
                                                        value={formData.bathroom_count}
                                                    >
                                                        <option value="0">0</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">Partition</span>
                                                    <label className="switch switch-lg flex items-center gap-2">
                                                        <input
                                                            className="checkbox"
                                                            name="include_partition"
                                                            type="checkbox"
                                                            checked={!!formData.include_partition}
                                                            onChange={() =>
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    include_partition: !prev.include_partition,
                                                                }))
                                                            }
                                                        />
                                                        <span className="text-sm">{formData.include_partition ? "Yes" : "No"}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-xl mb-4 font-semibold text-gray-900">Quotation</h2>
                            <div className="flex gap-8">
                                <div className="flex flex-col flex-1">
                                    <div className="flex flex-col gap-2 mb-8">
                                        <span className="text-base font-semibold text-gray-900">Select a Quotation</span>
                                        <span className="text-md font-semibold text-gray-900">
                                            <button className="link" onClick={handleSelectCustomQuotation}>
                                                Create a custom quotation
                                            </button>
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <InputFieldGroup
                                            fieldTitle="Completion Day(s)"
                                            description="Set the period for this renovation work completion day(s) (Working days)"
                                            type="number"
                                            placeholder=""
                                            name="completion_day"
                                            value={formData.completion_day}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 mb-8">
                                        <label className="text-sm font-medium text-gray-900">Final Pricing</label>
                                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                                            The final price that will be billed and displayed to the owner at the end (excluding bonuses)
                                        </span>
                                        <label className="switch switch-lg">
                                            <input
                                                className="checkbox"
                                                name="is_ready"
                                                type="checkbox"
                                                checked={!!formData.isFinalAmountEnable}
                                                onChange={toggleEnableFinalAmount}
                                            />
                                            <span className="switch-label">
                                                {formData.isFinalAmountEnable ? "Enable" : "Disable"}
                                            </span>
                                        </label>
                                        {formData.isFinalAmountEnable && (
                                            <input
                                                className="input mb-2"
                                                placeholder="Final Pricing"
                                                type="number"
                                                name="finalAmount"
                                                value={formData.finalAmount}
                                                onChange={handleChange}
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900 mb-2">Progressive Payment</span>
                                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                                            Set the payment schedule for the renovation work
                                        </span>
                                        <label className="switch switch-lg">
                                            <input
                                                className="checkbox"
                                                name="is_progressive_payment"
                                                type="checkbox"
                                                checked={!!formData.is_progressive_payment}
                                                onChange={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        is_progressive_payment: !prev.is_progressive_payment,
                                                    }))
                                                }
                                            />
                                            <span className="switch-label">
                                                {formData.is_progressive_payment ? "Progressive Payment" : "Full Payment"}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1 gap-2">
                                    <span className="text-base font-semibold text-gray-900">Apply Bonus (Optional)</span>
                                    <div className="flex flex-col mb-4">
                                        <label className="mb-2 text-sm font-medium text-gray-900">Bonus Description</label>
                                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                                            Set a description of the bonus
                                        </span>
                                        <textarea
                                            className="textarea"
                                            name="bonus.description"
                                            rows={5}
                                            value={formData.bonus?.description || ""}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>
                                    <InputFieldGroup
                                        fieldTitle="Bonus Value"
                                        description="Set a total value of the bonus"
                                        type="number"
                                        placeholder=""
                                        name="bonus.value"
                                        value={formData.bonus?.value}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {selectedQuotation && (
                        <>
                            <div className="card">
                                <div className="card-body quotation-info flex justify-between items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-semibold text-gray-900">{selectedQuotation.quotation_name}</span>
                                        <span className="text-base font-normal text-gray-800">
                                            Price: RM{" "}
                                            {(formData.totalAmount - (Number(formData.bonus?.value) || 0)).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                            {formData.bonus?.value &&
                                                ` (Discount: RM${Number(formData.bonus?.value).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })})`}
                                        </span>
                                        <span className="text-base font-normal text-slate-400">{selectedQuotation.description}</span>
                                    </div>
                                </div>
                            </div>
                            {selectedPackages && (() => {
                                const calculateQuotationMargin = () => {
                                    // Calculate total retail price
                                    const totalRetailPrice = formData.finalAmount ? formData.finalAmount : selectedPackages.reduce((total, pkg) => {
                                        if (pkg.is_addon === true && pkg.is_addon_included === false) {
                                            return total;
                                        }

                                        const packageRetail = pkg.products.reduce((pkgTotal, product) => {
                                            let supplyPrice = 0;
                                            if (product.pivot.includeSupply) {
                                                supplyPrice = (product.provisioning.supply.retail_price * product.pivot.quantity) || 0;
                                            } else {
                                                supplyPrice = (product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price) || 0;
                                            }

                                            let installPrice = 0;
                                            if (product.pivot.includeInstall) {
                                                installPrice = (product.provisioning.install.retail_price * product.pivot.quantity) || 0;
                                            } else {
                                                installPrice = (product.provisioning.install.retail_price - product.provisioning.install.excluded_price) || 0;
                                            }

                                            return pkgTotal + (supplyPrice + installPrice);
                                        }, 0);
                                        return total + (packageRetail * (pkg.quantity || 1));
                                    }, 0);

                                    const totalDiscountPrice = Number(selectedQuotation.bonus?.value || 0);

                                    // Calculate total COGS (Cost of Goods Sold)
                                    const totalCogs = selectedPackages.reduce((total, pkg) => {
                                        if (pkg.is_addon === true && pkg.is_addon_included === false) {
                                            return total;
                                        }

                                        const packageCogs = pkg.products.reduce((pkgTotal, product) => {
                                            const supplyCogs = product.pivot.includeSupply
                                                ? product.provisioning.supply.cogs * product.pivot.quantity
                                                : 0;
                                            const installCogs = product.pivot.includeInstall
                                                ? product.provisioning.install.cogs * product.pivot.quantity
                                                : 0;
                                            return pkgTotal + (supplyCogs + installCogs);
                                        }, 0);
                                        return total + (packageCogs * (pkg.quantity || 1));
                                    }, 0);

                                    // Calculate margin in amount
                                    const marginInAmount = totalRetailPrice - totalCogs;

                                    // Calculate margin in percentage
                                    const marginInPercentage = totalRetailPrice > 0
                                        ? (marginInAmount / totalRetailPrice) * 100
                                        : 0;

                                    return {
                                        totalCogs,
                                        marginInAmount,
                                        marginInPercentage
                                    };
                                };

                                const { totalCogs, marginInAmount, marginInPercentage } = calculateQuotationMargin();

                                const discount = formData.bonus ? Number(formData.bonus.value) : 0;
                                const nettAmount = totalExcludedAddonAmount - discount;
                                const nettMargin = nettAmount - totalCogs;
                                const nettMarginPercentage = nettAmount > 0 ? (nettMargin / nettAmount) * 100 : 0;

                                return (
                                    <div className="card w-full">
                                        <div className="card-header flex justify-between items-center">
                                            <h3 className="card-title">Summary Pricing</h3>
                                        </div>
                                        <div className="card-group pt-3.5 pb-3.5">
                                            <table className="table-auto w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="text-sm text-gray-600 pb-3 text-left">Category</th>
                                                        <th className="text-sm text-gray-600 pb-3 text-right">Total Price</th>
                                                        <th className="text-sm text-gray-600 pb-3 text-right">COGS</th>
                                                        <th className="text-sm text-gray-600 pb-3 text-right">Nett Margin</th>
                                                        <th className="text-sm text-gray-600 pb-3 text-right">Margin %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {packageCategories.map((category, index) => {
                                                        const categoryMargin = category.total_price - category.cogs;
                                                        const categoryMarginPercentage =
                                                            category.total_price > 0 ? (categoryMargin / category.total_price) * 100 : 0;

                                                        return (
                                                            <tr key={index}>
                                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">{category.category}</td>
                                                                <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                                    RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                                    RM {category.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                                    RM {categoryMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                                    {categoryMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {/* Totals Row */}
                                                    <tr className="border-t">
                                                        <td className="text-sm text-gray-600 font-bold pt-3 pe-4 lg:pe-8">Total</td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            RM {totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            RM {totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            RM {marginInAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            {marginInPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                        </td>
                                                    </tr>
                                                    {/* Bonus/Discount Row (if applicable) */}
                                                    {(formData.bonus && (Number(formData.bonus.value) > 0)) && (
                                                        <tr>
                                                            <td className="text-sm text-gray-600 pt-3 whitespace-nowrap">Bonus/Discount</td>
                                                            <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                                - RM {Number(formData.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">-</td>
                                                            <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                                - RM {Number(formData.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                                - {(marginInPercentage - nettMarginPercentage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {/* Nett Amount Row */}
                                                    <tr>
                                                        <td className="text-sm text-gray-600 font-bold pt-3 pe-4 lg:pe-8">Nett Amount</td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            RM {nettAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            RM {(totalCogs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            RM {nettMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                            {nettMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="card mb-6">
                                <div className="card-body">
                                    <div className="flex justify-between items-center flex-wrap mb-2">
                                        <h2 className="text-xl mb-4 font-semibold text-gray-900">Packages</h2>
                                        <button
                                            className="btn btn-outline btn-primary flex justify-center items-center mb-4"
                                            data-modal-toggle="#include_package_modal"
                                            onClick={openAddPackageModal}
                                        >
                                            <i className="ki-outline ki-plus-squared"></i>
                                            Add Packages
                                        </button>
                                    </div>
                                    <DndContext onDragEnd={handleDragEnd}>
                                        <SortableContext
                                            items={selectedPackages.map((pkg) => `package-${pkg.id}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="flex flex-col gap-5 mb-4" data-accordion="true">
                                                {selectedPackages.length > 0 &&
                                                    selectedPackages.map((prodPackage: Package) => (
                                                        <SortablePackage
                                                            key={prodPackage.id}
                                                            prodPackage={prodPackage}
                                                            categoryOptions={categoryOptions}
                                                            adjustPackageQuantity={adjustPackageQuantity}
                                                            handleRemovePackage={handleRemovePackage}
                                                            openAddProductModal={openAddProductModal}
                                                            toggleProperty={toggleProperty}
                                                            adjustQuantity={adjustQuantity}
                                                            handleRemoveProduct={handleRemoveProduct}
                                                            toggleIsAddonIncluded={toggleIsAddonIncluded}
                                                        />
                                                    ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="flex justify-end gap-4">
                        <button className="btn btn-lg btn-light" onClick={handleBackClick}>
                            Cancel
                        </button>
                        <button className="btn btn-lg btn-primary" onClick={handleSubmit}>
                            Create
                        </button>
                    </div>
                </div>
            </div>

            <div
                className="w-[400px] drawer drawer-start grow fixed z-1 top-20 lg:top-20 bottom-12 lg:bottom-12 lg:right-8 lg:left-auto lg:translate-x-0 lg:flex flex-col items-stretch shrink-0 bg-[#fefefe] dark:bg-coal-500"
                data-overlay="true"
                data-overlay-enable="true|lg:false"
                id="aside"
            >
                <div
                    className="card flex flex-col shrink-0 px-3 scrollable-y-hover max-h-dvh"
                    data-scrollable="true"
                    data-scrollable-dependencies="#header"
                    data-scrollable-height="auto"
                    data-scrollable-offset="15px"
                    data-scrollable-wrappers="#page"
                    id="aside_content"
                    style={{ height: "calc(100vh - 11em)", maxHeight: "calc(100vh - 11em)" }}
                >
                    {formDetail ? (
                        <>
                            <div className="card-header px-2">
                                <h2 className="text-base font-semibold">Form Detail</h2>
                            </div>
                            <div className="card-body flex flex-col text-gray-900 px-2 py-4">
                                <div className="flex flex-col mb-8">
                                    <span className="font-medium">Status</span>
                                    <span
                                        className={`badge badge-outline gap-1 items-center ${formDetail.status === "approved" ? "badge-success" : ""
                                            }`}
                                    >
                                        {formDetail.status.charAt(0).toUpperCase() + formDetail.status.slice(1)}
                                    </span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Salutations</span>
                                    <span className="font-semibold">{formDetail.user.salutations}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <label className="text-slate-900 mb-2 font-medium" htmlFor="name_f">
                                        Name
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex flex-col w-full">
                                            <span className="text-slate-400 font-medium">First Name</span>
                                            <span className="font-semibold">{formDetail.user.name_first}</span>
                                        </div>
                                        <div className="flex flex-col w-full">
                                            <span className="text-slate-400 font-medium">Last Name</span>
                                            <span className="font-semibold">{formDetail.user.name_last}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Preferred Name</span>
                                    <span className="font-semibold">{formDetail.user.name_preferred}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-2 flex-wrap">
                                        <div className="flex flex-col flex-auto mb-6 md:mb-0">
                                            <span className="text-slate-400 font-medium">Email</span>
                                            <span className="font-semibold">{formDetail.user.email}</span>
                                        </div>
                                        <div className="flex flex-col flex-auto">
                                            <span className="text-slate-400 font-medium">Phone Number</span>
                                            <span className="font-semibold">
                                                +{formDetail.user.country_code} {formDetail.user.phone_no}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <label className="text-slate-900 mb-2 font-medium" htmlFor="address_1">
                                        Current residence address (information needed for renovation agreement purpose)
                                    </label>
                                    <div className="flex flex-col mb-8">
                                        <span className="text-slate-400 font-medium">Address Line 1</span>
                                        <span className="font-semibold">{formDetail.address.address_1}</span>
                                    </div>
                                    <div className="flex flex-col mb-8">
                                        <span className="text-slate-400 font-medium">Address Line 2</span>
                                        <span className="font-semibold">{formDetail.address.address_2}</span>
                                    </div>
                                    <div className="flex flex-col mb-8">
                                        <div className="flex gap-2">
                                            <div className="flex flex-col w-full">
                                                <span className="text-slate-400 font-medium">City</span>
                                                <span className="font-semibold">{formDetail.address.city}</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <span className="text-slate-400 font-medium">State</span>
                                                <span className="font-semibold">{formDetail.address.state}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 font-medium">Postal / Zip Code</span>
                                        <span className="font-semibold">{formDetail.address.postcode}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">IC / ID number</span>
                                    <span className="font-semibold">{formDetail.user.ic}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Property to be renovated</span>
                                    <span className="font-semibold">
                                        {formDetail.property
                                            ? formDetail.property.property_name
                                            : "(Other) " + formDetail.other_property.property_name}
                                    </span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-400 font-medium">Unit</span>
                                        <span className="font-semibold">
                                            {formDetail.property
                                                ? `${formDetail.property.block}-${formDetail.property.level}-${formDetail.property.unit}`
                                                : `${formDetail.other_property.block}-${formDetail.other_property.level}-${formDetail.other_property.unit}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Layout Type</span>
                                    <span className="font-semibold">
                                        {formDetail.property
                                            ? formDetail.property.layout_type
                                            : formDetail.other_property.layout_type}
                                    </span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Sqft</span>
                                    <span className="font-semibold">
                                        {formDetail.property ? formDetail.property.sqft : formDetail.other_property.sqft}
                                    </span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">
                                        What's your original number of rooms?
                                    </span>
                                    <span className="font-semibold">{formDetail.questions.quest_1}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">What's the number of bathroom?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_2}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already Vacant Possessions (VP)?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_3}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already collect key?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_4}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already done defect inspection?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_5}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">
                                        Already submit defect submission to MO?
                                    </span>
                                    <span className="font-semibold">{formDetail.questions.quest_6}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">
                                        MO has completed that defect rectification?
                                    </span>
                                    <span className="font-semibold">{formDetail.questions.quest_7}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">
                                        Do you want to add partition room to your unit?
                                    </span>
                                    <span className="font-semibold">{formDetail.questions.quest_8}</span>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-sm text-gray-900 font-bold text-justify">
                                        Please help us understand the furnishing condition of your unit for the following areas:
                                    </span>
                                </div>
                                <div className="flex flex-col flex-wrap mb-8">
                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2>Foyer & entrance</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">
                                                        Furnished
                                                    </div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">
                                                        Not Furnished
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Grille door</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.grille_door === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.grille_door === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.digital_lock === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.digital_lock === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.shoe_cabinet === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.shoe_cabinet === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.lights === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.lights === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="furnishing.foyer_entrance.other">
                                            Remarks
                                        </label>
                                        <span className="textarea">
                                            {formDetail.furnishing.foyer_entrance.other
                                                ? formDetail.furnishing.foyer_entrance.other
                                                : "-"}
                                        </span>
                                    </div>
                                    <hr className="mb-8" />
                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2>Kitchen</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">
                                                        Furnished
                                                    </div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">
                                                        Not Furnished
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        Kitchen cabinet
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_cabinet === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_cabinet === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        Kitchen island
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_island === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_island === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        Sink & tap
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.sink_tap === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.sink_tap === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        Hood and hob
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.hood_hob === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.hood_hob === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.microwave === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.microwave === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.oven === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.oven === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        Water dispenser / water purifier
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.water_dispenser === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.water_dispenser === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.fridge === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.fridge === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.lights === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.lights === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="kitchen.other">
                                            Remarks
                                        </label>
                                        <span className="textarea">
                                            {formDetail.furnishing.kitchen.other ? formDetail.furnishing.kitchen.other : "-"}
                                        </span>
                                    </div>
                                    <hr className="mb-8" />
                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2>Yard</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">
                                                        Furnished
                                                    </div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">
                                                        Not Furnished
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Washer</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.washer === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.washer === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.dryer === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.dryer === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.lights === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.lights === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="yard.other">
                                            Remarks
                                        </label>
                                        <span className="textarea">
                                            {formDetail.furnishing.yard.other ? formDetail.furnishing.yard.other : "-"}
                                        </span>
                                    </div>
                                    <hr className="mb-8" />
                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2>Dining</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">
                                                        Furnished
                                                    </div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">
                                                        Not Furnished
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        Dining table & chairs
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.dining_table_chairs === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.dining_table_chairs === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.lights === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.lights === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.fan === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.fan === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="dining.other">
                                            Remarks
                                        </label>
                                        <span className="textarea">
                                            {formDetail.furnishing.dining.other ? formDetail.furnishing.dining.other : "-"}
                                        </span>
                                    </div>
                                    <hr className="mb-8" />
                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2>Living</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">
                                                        Furnished
                                                    </div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">
                                                        Not Furnished
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Sofa</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.sofa === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.sofa === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        Coffee table
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.coffee_table === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.coffee_table === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">
                                                        TV cabinet
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv_cabinet === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv_cabinet === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.fan === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.fan === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.lights === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.lights === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.ac === "furnished" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.ac === "not-furnish" && (
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="living.other">
                                            Remarks
                                        </label>
                                        <span className="textarea">
                                            {formDetail.furnishing.living.other ? formDetail.furnishing.living.other : "-"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Attachments</span>
                                    {formDetail.attachments && Object.keys(formDetail.attachments).length > 0 ? (
                                        <ul>
                                            {Object.keys(formDetail.attachments).map((key) => {
                                                const attachment = formDetail.attachments[key];
                                                return (
                                                    <li key={key}>
                                                        {attachment.file_url ? (
                                                            <a
                                                                href={AWS_S3_URL + attachment.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="badge badge-lg mb-2"
                                                            >
                                                                {attachment.original_name}
                                                            </a>
                                                        ) : (
                                                            "No file available"
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p>No attachments found.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card-body flex flex-col items-center justify-center">
                            <img
                                alt="image"
                                className="dark:hidden max-h-[160px] mb-12"
                                src={`${MEDIA_URL}illustrations/3.svg`}
                            />
                            <img
                                alt="image"
                                className="light:hidden max-h-[160px] mb-12"
                                src={`${MEDIA_URL}illustrations/3-dark.svg`}
                            />
                            <span className="text-gray-800 text-lg font-semibold text-center">
                                No Registration Form selected
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <IncludeOrderQuotationPackageModal
                selectedPackages={selectedPackages}
                setSelectedPackages={setSelectedPackages}
            />
            <IncludeQuotationProductModal
                selectedPackages={selectedPackages}
                setSelectedPackages={setSelectedPackages}
                selectedPackageId={selectedPackageId}
                recalculateTotalAmount={recalculateTotalAmount}
            />
        </>
    );
}

export default CreateOrder;