"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Search, UserIcon, Building, PackageIcon, CreditCard, Check, ChevronDown, X, ReceiptText } from "lucide-react"
import { PackageSelector } from "./components/package-selector"
import { ProductModal } from "./components/product-modal"
import { Order, Package, Product, Property, User } from "../../types"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { createOrder, fetchOrder, fetchProperties, fetchProperty, fetchUser, fetchUsers, updateOrder } from "../../services/api"
import { SortablePackageItem } from "./components/SortablePackageItem"
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Slide, toast } from "react-toastify"
import useFetchOrder from "../../hook/useFetchOrder"
import CustomerStep from "./components/steps/CustomerStep"
import PropertyStep from "./components/steps/PropertyStep"
import PackagesStep from "./components/steps/PackageStep"
import PricingStep from "./components/steps/PricingStep"

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

interface FormData {
    unitType: string;
    block: string;
    floor: string;
    unitNo: string;
    queenBedrooms: number;
    singleBedrooms: number;
    studios: number;
    bathrooms: number;
    includePartition: boolean;
    completionDays: number;
    isProgressivePayment: boolean;
    isDraftMode: boolean;
    isBePowered: boolean;
    tenure: number;
    finalAmount: number;
    bonusDescription: string;
    bonusValue: number;
    internalRemark: string;
}

const steps = [
    { id: "customer", title: "Owner", icon: UserIcon },
    { id: "property", title: "Property", icon: Building },
    { id: "packages", title: "Packages", icon: PackageIcon },
    { id: "pricing", title: "Pricing", icon: CreditCard },
]

export default function EditOrder() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const { orderDetail, loading, error } = useFetchOrder(orderId);

    const [currentStep, setCurrentStep] = useState(0)
    const [isDraftMode, setIsDraftMode] = useState(false)
    const [isCreatingOrder, setIsCreatingOrder] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
    const [selectedPackages, setSelectedPackages] = useState<Package[]>([])
    const [showPackageSelector, setShowPackageSelector] = useState(false)
    const [showProductModal, setShowProductModal] = useState(false)
    const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({})
    const [activePackageId, setActivePackageId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        unitType: "",
        block: "",
        floor: "",
        unitNo: "",
        queenBedrooms: 1,
        singleBedrooms: 1,
        studios: 0,
        bathrooms: 1,
        includePartition: false,
        completionDays: 30,
        isProgressivePayment: true,
        isDraftMode: false,
        isBePowered: false,
        finalAmount: 0,
        tenure: 12,
        bonusDescription: "",
        bonusValue: 0,
        internalRemark: "",
    } as FormData)

    const notify = (type: "success" | "error", message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem("theme") as string,
            transition: Slide,
        });
    };

    useEffect(() => {
        document.title = "Revise Quotation Order | RenoXpert";

        if (orderDetail) {
            const runAsyncTasks = async () => {
                setFormData({
                    finalAmount: orderDetail.final_amount || 0,
                    unitType: orderDetail.unit_type || "",
                    block: orderDetail.block || "",
                    floor: orderDetail.floor || "",
                    unitNo: orderDetail.unit_no || "",
                    isDraftMode: !orderDetail.user_id,
                    singleBedrooms: orderDetail.single_bedroom_count,
                    queenBedrooms: orderDetail.queen_bedroom_count,
                    studios: orderDetail.studio_count,
                    bathrooms: orderDetail.bathroom_count,
                    completionDays: orderDetail.completion_day,
                    internalRemark: orderDetail.internal_remark || "",
                    includePartition: !!orderDetail.include_partition,
                    isProgressivePayment: !!orderDetail.is_progressive_payment,
                    isBePowered: !!orderDetail.is_be_powered,
                    tenure: orderDetail.tenure || 0,
                    bonusDescription: orderDetail.latest_quotation.bonus?.description || "",
                    bonusValue: Number(orderDetail.latest_quotation.bonus?.value) || 0,
                });

                if (orderDetail.user_id) await handleSelectUserById(Number(orderDetail.user_id));
                if (orderDetail.property_id) await handleSelectPropertytById(Number(orderDetail.property_id));

                setIsDraftMode(!orderDetail.user_id);
                setSelectedPackages(orderDetail.latest_quotation.packages ? orderDetail.latest_quotation.packages : []);
            };
            runAsyncTasks();

        }
    }, [orderDetail]);

    const handleSelectUserById = async (id: number) => {
        try {
            const data = await fetchUser(id);
            setFormData((prev) => ({ ...prev, isDraftMode: false }));
            setSelectedCustomer(data.data);
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const handleSelectPropertytById = async (id: number) => {
        try {
            const data = await fetchProperty(id);
            setSelectedProperty(data.data);
        } catch (error) {
            console.error("Error fetching property:", error);
        }
    };

    /**
     * Handles the toggle functionality for addon packages
     * @param packageId - The ID of the package to toggle
     * @param isIncluded - Boolean flag to set the addon inclusion state
     */
    const handleAddonPackageToggle = (packageId: number, isIncluded: boolean): void => {
        setSelectedPackages(prevPackages =>
            prevPackages.map(pkg => {
                if (pkg.id === packageId && pkg.is_addon === true) {
                    const updatedPackage: Package = {
                        ...pkg,
                        is_addon_included: isIncluded
                    };

                    return updatedPackage;
                }
                return pkg;
            })
        );
    };

    const handleQuoBePoweredToggle = (isIncluded: boolean): void => {
        setFormData(prevFormData => ({
            ...prevFormData,
            isBePowered: isIncluded
        }));
    }

    const handleBePoweredPackageToggle = (packageId: number, isIncluded: boolean): void => {
        console.log(isIncluded);
        setSelectedPackages(prevPackages =>
            prevPackages.map(pkg => {
                if (pkg.id === packageId) {
                    const updatedPackage: Package = {
                        ...pkg,
                        is_be_powered: isIncluded
                    };
                    return updatedPackage;
                }
                return pkg;
            })
        );
    };

    const handleBePoweredPackageIncludeToggle = (packageId: number, isIncluded: boolean): void => {
        setSelectedPackages(prevPackages =>
            prevPackages.map(pkg => {
                if (pkg.id === packageId) {
                    const updatedPackage: Package = {
                        ...pkg,
                        is_be_powered_included: isIncluded
                    };
                    return updatedPackage;
                }
                return pkg;
            })
        );
    };

    const handlePaymentMethodChange = (packageId: number, paymentMethod: string) => {
        setSelectedPackages(prevPackages =>
            prevPackages.map(pkg => {
                if (pkg.id === packageId) {
                    const updatedPackage: Package = {
                        ...pkg,
                        payment_method: paymentMethod
                    };
                    return updatedPackage;
                }
                return pkg;
            })
        );
    };

    /**
     * Validates if an addon package is properly configured
     * @param pkg - The package to validate
     * @returns boolean indicating if the addon is valid
     */
    const validateAddonPackage = (pkg: Package): boolean => {
        if (!pkg.is_addon) return true;

        // Addon packages must have a defined inclusion state
        return pkg.is_addon_included !== undefined;
    };

    const selectedProducts = useMemo(() => {
        if (!activePackageId) return [];
        const activePackage = selectedPackages.find(pkg => pkg.id === activePackageId);
        return activePackage?.products || [];
    }, [selectedPackages, activePackageId]);

    const onSelectProduct = (product: Product) => {
        if (!activePackageId) return;
        console.log('test');

        setSelectedPackages(prevPackages => {
            return prevPackages.map(pkg => {
                if (pkg.id !== activePackageId) return pkg;

                const existingIndex = pkg.products.findIndex(p => p.id === product.id);
                let updatedProducts;

                if (existingIndex > -1) {
                    // Remove the product
                    updatedProducts = pkg.products.filter((_, idx) => idx !== existingIndex);
                } else {
                    // Add the product
                    const newProduct = {
                        ...product,
                        quantity: 1,
                        pivot: {
                            package_id: activePackageId,
                            product_id: product.id,
                            quantity: 1,
                            included: true,
                            visibility: true,
                            includeSupply: true,
                            includeInstall: true,
                            isOriginal: false,
                        },
                    };

                    updatedProducts = [...pkg.products, newProduct];
                }

                const newTotalPrice = updatedProducts.reduce((sum, p) => {
                    const supply = p.provisioning?.supply?.retail_price || 0;
                    const install = p.provisioning?.install?.retail_price || 0;
                    const qty = p.pivot?.quantity || 1;
                    return sum + (supply * qty) + (install * qty);
                }, 0);

                return {
                    ...pkg,
                    products: updatedProducts,
                    total_price: newTotalPrice,
                };
            });
        });

        calculateTotalAmount?.(); // Call this if available to update UI totals
    };

    const onRemoveProduct = (productId: number) => {
        if (!activePackageId) return;

        setSelectedPackages(prev =>
            prev.map(pkg =>
                pkg.id === activePackageId
                    ? {
                        ...pkg,
                        products: pkg.products?.filter(p => p.id !== productId) || [],
                    }
                    : pkg
            )
        );
    };

    /**
     * Gets all addon packages from the selected packages
     * @returns Array of addon packages
     */
    const getAddonPackages = (): Package[] => {
        return selectedPackages.filter(pkg => pkg.is_addon === true);
    };

    /**
     * Gets all included addon packages
     * @returns Array of included addon packages
     */
    const getIncludedAddonPackages = (): Package[] => {
        return selectedPackages.filter(pkg =>
            pkg.is_addon === true && pkg.is_addon_included === true
        );
    };

    /**
     * Calculates the total amount including only included addon packages
     * @returns Total amount for pricing calculations
     */
    const calculateTotalAmount = (): number => {
        return selectedPackages.reduce((sum, pkg) => {
            // Skip excluded addon packages from pricing calculations
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return sum;
            }

            if (!pkg.products || pkg.products.length === 0) {
                return sum + (pkg.total_price || 0) * (pkg.quantity || 1)
            }

            const packageTotal = pkg.products.reduce((prodSum, product) => {
                let supplyPrice = 0
                let installPrice = 0

                // Calculate supply price
                if (product.provisioning?.supply) {
                    if (product.pivot?.includeSupply) {
                        supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1)
                    } else {
                        supplyPrice = Math.max(0,
                            (product.provisioning.supply.retail_price || 0) -
                            (product.provisioning.supply.excluded_price || 0)
                        ) * (product.pivot?.quantity || 1)
                    }
                }

                // Calculate install price
                if (product.provisioning?.install) {
                    if (product.pivot?.includeInstall) {
                        installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1)
                    } else {
                        installPrice = Math.max(0,
                            (product.provisioning.install.retail_price || 0) -
                            (product.provisioning.install.excluded_price || 0)
                        ) * (product.pivot?.quantity || 1)
                    }
                }

                return prodSum + supplyPrice + installPrice
            }, 0)

            return sum + packageTotal * (pkg.quantity || 1)
        }, 0)
    }

    const totalAmount = calculateTotalAmount()
    const finalAmount = formData.finalAmount > 0 ? formData.finalAmount : totalAmount
    const netAmount = finalAmount - (formData.bonusValue || 0)

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleToggleDraftMode = (isDraft: boolean) => {
        setIsDraftMode(isDraft)
        setFormData(prev => ({ ...prev, isDraftMode: isDraft }))
        setSelectedCustomer(null)
    }

    // Handle package drag and drop
    const handlePackageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = selectedPackages.findIndex(pkg => `package-${pkg.id}` === active.id);
        const newIndex = selectedPackages.findIndex(pkg => `package-${pkg.id}` === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedPackages = arrayMove(selectedPackages, oldIndex, newIndex);
            setSelectedPackages(reorderedPackages);
        }
    };

    // Handle product updates within packages
    const handleProductsUpdate = (packageId: number, products: Product[]) => {
        setSelectedPackages(prev =>
            prev.map(pkg =>
                pkg.id === packageId
                    ? { ...pkg, products }
                    : pkg
            )
        );
    };

    const handleCreateOrder = async () => {
        setIsCreatingOrder(true);
        const errors: { [key: string]: string } = {};

        // Validation for non-draft mode
        if (!formData.isDraftMode) {
            if (!selectedCustomer) {
                errors.customer = "Please select a customer.";
            }
            if (!selectedProperty) {
                errors.property = "Please select a property.";
            }
            if (!formData.block || !formData.floor || !formData.unitNo) {
                errors.property = errors.property
                    ? `${errors.property} Also, please enter block, floor, and unit number.`
                    : "Please enter block, floor, and unit number.";
            }
        }

        // Validate packages
        if (selectedPackages.length === 0) {
            errors.packages = "Please select at least one package.";
        } else {
            // Validate addon packages
            const invalidAddon = selectedPackages.find(
                (pkg) => pkg.is_addon && pkg.is_addon_included === undefined
            );
            if (invalidAddon) {
                errors.packages = `Please specify inclusion status for addon package: ${invalidAddon.name}.`;
            }
        }

        // Validate pricing
        if (formData.finalAmount < 0) {
            errors.pricing = "Final amount cannot be negative.";
        }
        if (formData.bonusValue < 0) {
            errors.pricing = errors.pricing
                ? `${errors.pricing} Also, bonus value cannot be negative.`
                : "Bonus value cannot be negative.";
        }
        if (formData.completionDays <= 0) {
            errors.pricing = errors.pricing
                ? `${errors.pricing} Also, completion days must be greater than zero.`
                : "Completion days must be greater than zero.";
        }

        // If there are validation errors, notify the user and stop
        if (Object.keys(errors).length > 0) {
            setStepErrors(errors);
            Object.values(errors).forEach((error) => notify("error", error));
            return;
        }

        // Clear previous errors
        setStepErrors({});

        // Prepare order data
        const orderData: Order = {
            id: orderDetail.id,
            user_id: selectedCustomer?.id || null,
            property_id: selectedProperty?.id || null,
            quotation_id: null,
            total_amount: netAmount,
            final_amount: null,
            unit_type: formData.unitType,
            block: formData.block,
            floor: formData.floor,
            unit_no: formData.unitNo,
            single_bedroom_count: formData.singleBedrooms,
            queen_bedroom_count: formData.queenBedrooms,
            studio_count: formData.studios,
            bathroom_count: formData.bathrooms,
            include_partition: formData.includePartition,
            is_progressive_payment: formData.isProgressivePayment,
            is_be_powered: formData.isBePowered,
            description: "",
            internal_remark: formData.internalRemark,
            completion_day: formData.completionDays,
            tenure: formData.tenure,
            bonus: {
                description: formData.bonusDescription,
                value: formData.bonusValue,
            },
            metadata: selectedPackages ? JSON.stringify(selectedPackages) : undefined,
        };

        try {
            const response = await updateOrder(orderData);

            if (response?.success) {
                notify("success", "Order Amended Successfully!");
                navigate(LOCAL_PATH_PREFIX + "orders/" + response.data.id);
            }

        } catch (error) {
            // Handle API or unexpected errors
            console.error("Error creating order:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while creating the order.";
            notify("error", errorMessage);
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleAddProduct = (packageId: number) => {
        setActivePackageId(packageId);
        setShowProductModal(true);
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link
                                to={LOCAL_PATH_PREFIX + 'orders/' + orderId}
                                className="p-2 rounded-full hover:bg-gray-100/80 transition-colors duration-200"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-700" />
                            </Link>
                            <h1 className="text-xl font-semibold text-gray-900">Amend Quotation</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 font-medium">Draft Mode</span>
                                <button
                                    onClick={() => handleToggleDraftMode(!isDraftMode)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDraftMode ? "bg-blue-500" : "bg-gray-200"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${isDraftMode ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            {/* Order Number */}
                            <div className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/50 border border-blue-200 shadow-2xl rounded-3xl text-center">
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                                        <ReceiptText className="h-5 w-5" /> {/* Icon from Lucide or similar */}
                                    </div>
                                    <div className="text-sm text-gray-500 tracking-wide">Order Number</div>
                                    <div className="text-xl font-bold text-blue-700 tracking-widest">
                                        {orderDetail?.order_no || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Steps */}
                            <div className="p-6 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
                                <div className="space-y-4">
                                    {steps.map((step, index) => {
                                        const Icon = step.icon
                                        const isActive = index === currentStep
                                        const isCompleted = index < currentStep
                                        const isError = stepErrors[step.id] !== undefined

                                        return (
                                            <motion.div
                                                key={step.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${isError
                                                    ? "bg-red-50 text-red-700 hover:bg-red-100" :
                                                    isActive
                                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                                        : isCompleted
                                                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                                                            : "text-gray-500 hover:bg-gray-50"
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setCurrentStep(index)}
                                            >
                                                <div
                                                    className={`p-2 rounded-lg ${isError ? "bg-red-100"
                                                        : isActive
                                                            ? "bg-white/20"
                                                            : isCompleted
                                                                ? "bg-green-100"
                                                                : "bg-gray-100"
                                                        }`}
                                                >
                                                    {isError ?
                                                        <X className="h-4 w-4" />
                                                        : isCompleted
                                                            ? <Check className="h-4 w-4" />
                                                            : <Icon className="h-4 w-4" />
                                                    }
                                                </div>
                                                <span className="font-medium">{step.title}</span>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {currentStep === 0 && (
                                    <CustomerStep
                                        isDraftMode={isDraftMode}
                                        selectedCustomer={selectedCustomer}
                                        setSelectedCustomer={setSelectedCustomer}
                                        formData={formData}
                                        setFormData={setFormData}
                                        stepErrors={stepErrors}
                                    />
                                )}

                                {currentStep === 1 && (
                                    <PropertyStep
                                        selectedProperty={selectedProperty}
                                        setSelectedProperty={setSelectedProperty}
                                        formData={formData}
                                        setFormData={setFormData}
                                    />
                                )}

                                {currentStep === 2 && (
                                    <PackagesStep
                                        formData={formData}
                                        setFormData={setFormData}
                                        selectedPackages={selectedPackages}
                                        setSelectedPackages={setSelectedPackages}
                                        onAddPackage={() => setShowPackageSelector(true)}
                                        onAddProduct={handleAddProduct}
                                        totalAmount={totalAmount}
                                        onPackageDragEnd={handlePackageDragEnd}
                                        onProductsUpdate={handleProductsUpdate}
                                        onAddonToggle={handleAddonPackageToggle}
                                        onQuoBePoweredToggle={handleQuoBePoweredToggle}
                                        onBePoweredToggle={handleBePoweredPackageToggle}
                                        onBePoweredIncludeToggle={handleBePoweredPackageIncludeToggle}
                                        onPaymentMethodChange={handlePaymentMethodChange}
                                    />
                                )}

                                {currentStep === 3 && (
                                    <PricingStep
                                        formData={formData}
                                        setFormData={setFormData}
                                        totalAmount={totalAmount}
                                        netAmount={netAmount}
                                        selectedPackages={selectedPackages}
                                        addonPackages={getAddonPackages()}
                                        includedAddonPackages={getIncludedAddonPackages()}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${currentStep === 0
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                                    }`}
                            >
                                Previous
                            </button>

                            {currentStep === steps.length - 1 ? (
                                <button
                                    onClick={handleCreateOrder}
                                    className="px-8 py-3 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25"
                                >
                                    Amend Quotation
                                </button>
                            ) : (
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PackageSelector
                isOpen={showPackageSelector}
                onClose={() => setShowPackageSelector(false)}
                selectedPackages={selectedPackages}
                onSelectPackage={(pkg) => {
                    setSelectedPackages((prev) => [...prev, {
                        ...pkg,
                        quantity: 1,
                        is_addon_included: pkg.is_addon ? false : undefined,
                        is_be_powered: false,
                        is_be_powered_included: false,
                        payment_method: 'bepowered',
                    }])
                }}
                onRemovePackage={(pkgId) => {
                    setSelectedPackages((prev) => prev.filter((pkg) => pkg.id !== pkgId))
                }}
            />

            <ProductModal
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false);
                    setActivePackageId(null); // Reset active package
                }}
                selectedProducts={selectedProducts}
                onSelectProduct={onSelectProduct}
                onRemoveProduct={onRemoveProduct}
            />

            {isCreatingOrder && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <svg
                            className="animate-spin h-10 w-10 text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 018 8h-4l3.5 3.5L24 12h-4a8 8 0 01-8 8v-4l-3.5 3.5L12 24v-4a8 8 0 01-8-8z"
                            />
                        </svg>
                        <p className="text-gray-700 font-medium text-sm">Creating Order...</p>
                    </motion.div>
                </motion.div>
            )}


        </div>
    )
}