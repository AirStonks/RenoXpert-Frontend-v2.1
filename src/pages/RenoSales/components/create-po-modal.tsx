import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    FileText,
    X,
    Search,
    ShoppingCart,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    Plus,
    Minus,
    // Trash2,
    PackageIcon,
} from "lucide-react"
import { Package, Product, PurchaseOrder, Sale, User, POPackage, POItem } from "../../../types"
// import { POPackageSelector } from "./po-package-selector"
// import { POProductModal } from "./po-product-selector"
import { Slide, toast } from "react-toastify"
import { createPurchaseOrder, fetchUsers, fetchPurchaseOrdersBySaleId } from "../../../services/api"

interface CreatePOModalProps {
    sales: Sale[]
    isOpen: boolean
    onCreate?: (purchaseOrder: PurchaseOrder) => void
    onClose: () => void
}

export default function CreatePOModal({ sales, isOpen, onCreate, onClose }: CreatePOModalProps) {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [isVisible, setIsVisible] = useState(false)
    // const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState(false)
    // const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [selectedVendor, setSelectedVendor] = useState<User | null>(null)
    const [selectedPackages, setSelectedPackages] = useState<Package[]>([])
    const [expandedSelectedPackages, setExpandedSelectedPackages] = useState<Set<number>>(new Set())
    const [searchVendorTerm, setSearchVendorTerm] = useState("")
    const [showSaleDropdown, setShowSaleDropdown] = useState(false)
    const [showVendorDropdown, setShowVendorDropdown] = useState(false)
    // const [activePackageId, setActivePackageId] = useState<number>(null)
    const [vendorDropdown, setVendorDropdown] = useState<User[]>([])
    const [internalNote, setInternalNote] = useState("")
    // Store existing purchase orders to track what's already been ordered
    const [existingPurchaseOrders, setExistingPurchaseOrders] = useState<PurchaseOrder[]>([])

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    // Handle visibility and animation state
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isVisible])

    // Fetch Vendor when the dropdown is opened
    useEffect(() => {
        if (showVendorDropdown) {
            try {
                const response = fetchUsers("", "backend-vendor")

                response.then((data) => {
                    setVendorDropdown(data.data)
                })

            } catch (error) {
                notify("error", "Failed to fetch vendors");
            }
        }
    }, [showVendorDropdown])

    const handleBackdropClick = () => {
        setSelectedSale(null)
        setSelectedPackages([])
        setSelectedVendor(null)
        // setActivePackageId(null)
        onClose()
    }

    const handleSaleSelection = async (sale: Sale) => {
        setSelectedSale(sale)
        setSearchVendorTerm("")
        setShowSaleDropdown(false)

        try {
            // Fetch existing purchase orders for this sale
            const existingPOsResponse = await fetchPurchaseOrdersBySaleId(sale.id!)
            const existingPOs = existingPOsResponse.data || []

            setExistingPurchaseOrders(existingPOs)

            // Auto-select packages based on the new logic
            const packagesToSelect = sale.order.latest_quotation.packages.filter(pkg => {
                // For add-on packages, only select if is_addon_included is true
                if (pkg.is_addon) {
                    return pkg.is_addon_included === true
                }
                // For non-addon packages, select all
                return true
            })

            // Auto-assign supply_qty and install_qty for each product with deduction logic
            const packagesWithCalculatedQuantities = packagesToSelect.map(pkg => ({
                ...pkg,
                products: pkg.products?.map(product => {
                    // Calculate base quantities
                    const baseQuantity = (product.pivot?.quantity || 1) * (pkg.quantity || 1)
                    const baseSupplyQty = product.pivot?.includeSupply ? baseQuantity : 0
                    const baseInstallQty = product.pivot?.includeInstall ? baseQuantity : 0

                    // Calculate quantities already ordered in existing POs
                    let existingSupplyQty = 0
                    let existingInstallQty = 0

                    existingPOs.forEach((po: PurchaseOrder) => {
                        po.po_packages?.forEach((poPackage: POPackage) => {
                            if (String(poPackage.package_id) === String(pkg.id)) {
                                poPackage.po_items?.forEach((poItem: POItem) => {
                                    if (String(poItem.product_id) === String(product.id)) {
                                        existingSupplyQty += poItem.supply_qty || 0
                                        existingInstallQty += poItem.install_qty || 0
                                    }
                                })
                            }
                        })
                    })

                    // Deduct existing quantities from base quantities
                    const remainingSupplyQty = Math.max(0, baseSupplyQty - existingSupplyQty)
                    const remainingInstallQty = Math.max(0, baseInstallQty - existingInstallQty)

                    return {
                        ...product,
                        pivot: {
                            ...product.pivot,
                            quantity: baseQuantity,
                            supply_qty: remainingSupplyQty,
                            install_qty: remainingInstallQty,
                        }
                    }
                }) || []
            }))

            // Filter out packages where all items have 0 quantity for both supply_qty and install_qty
            const packagesWithNonZeroQuantities = packagesWithCalculatedQuantities.filter(pkg => {
                // Check if any product in the package has non-zero supply_qty or install_qty
                return (pkg.products || []).some(product => {
                    const supplyQty = product.pivot?.supply_qty || 0
                    const installQty = product.pivot?.install_qty || 0
                    return supplyQty > 0 || installQty > 0
                })
            })

            setSelectedPackages(packagesWithNonZeroQuantities)
        } catch (error) {
            console.error("Error fetching existing purchase orders:", error)
            notify("error", "Failed to fetch existing purchase orders")

            // Fallback to original logic if API call fails
            const packagesToSelect = sale.order.latest_quotation.packages.filter(pkg => {
                if (pkg.is_addon) {
                    return pkg.is_addon_included === true
                }
                return true
            })

            const packagesWithCalculatedQuantities = packagesToSelect.map(pkg => ({
                ...pkg,
                products: pkg.products?.map(product => ({
                    ...product,
                    pivot: {
                        ...product.pivot,
                        quantity: (product.pivot?.quantity || 1) * (pkg.quantity || 1),
                        supply_qty: product.pivot?.includeSupply ? (product.pivot?.quantity || 1) * (pkg.quantity || 1) : 0,
                        install_qty: product.pivot?.includeInstall ? (product.pivot?.quantity || 1) * (pkg.quantity || 1) : 0,
                    }
                })) || []
            }))

            // Filter out packages where all items have 0 quantity for both supply_qty and install_qty
            const packagesWithNonZeroQuantities = packagesWithCalculatedQuantities.filter(pkg => {
                // Check if any product in the package has non-zero supply_qty or install_qty
                return (pkg.products || []).some(product => {
                    const supplyQty = product.pivot?.supply_qty || 0
                    const installQty = product.pivot?.install_qty || 0
                    return supplyQty > 0 || installQty > 0
                })
            })

            setSelectedPackages(packagesWithNonZeroQuantities)
        }
    }

    const handleVendorSelection = (vendor: User) => {
        setSelectedVendor(vendor)
        setShowVendorDropdown(false)
    }

    const handleSearchVendor = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;
        setSearchVendorTerm(searchValue);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        try {
            debounceTimeout.current = setTimeout(async () => {
                const response = fetchUsers(searchValue, "backend-vendor");
                response.then((data) => {
                    setVendorDropdown(data.data);
                });
            }, 500);
        } catch (error) {
            notify("error", "Failed to fetch vendors");
        }
    };

    const toggleSelectedPackageExpansion = (packageId: number) => {
        const newExpanded = new Set(expandedSelectedPackages)
        if (newExpanded.has(packageId)) {
            newExpanded.delete(packageId)
        } else {
            newExpanded.add(packageId)
        }
        setExpandedSelectedPackages(newExpanded)
    }

    // const handleSelectCustomPackage = (pkg: Package) => {
    //     let newSelectedPackages = [...selectedPackages]
    //     newSelectedPackages = [...newSelectedPackages, pkg]
    //     setSelectedPackages(newSelectedPackages)
    // }

    // const handleSelectCustomProduct = (product: Product) => {
    //     const updatedProduct: Product = {
    //         ...product,
    //         pivot: {
    //             quantity: 1,
    //             includeSupply: true,
    //             includeInstall: true
    //         }
    //     }

    //     const newSelectedPackages = [...selectedPackages]

    //     const selectedPackage = newSelectedPackages.find((p) => p.id === activePackageId)

    //     if (selectedPackage) {
    //         selectedPackage.products = [...selectedPackage.products, updatedProduct]
    //     }

    //     setSelectedPackages(newSelectedPackages)
    // }

    const calculateProductPrice = (
        product: Product,
        customQuantity?: number,
        customSupplyQty?: number,
        customInstallQty?: number,
    ) => {
        const supplyQty = customSupplyQty ?? product.pivot?.supply_qty ?? 0
        const installQty = customInstallQty ?? product.pivot?.install_qty ?? 0

        let price = 0
        if (supplyQty > 0 && product.provisioning?.supply?.cogs) {
            price += (product.provisioning.supply.cogs || 0) * supplyQty
        }
        if (installQty > 0 && product.provisioning?.install?.cogs) {
            price += (product.provisioning.install.cogs || 0) * installQty
        }

        return price
    }

    const calculatePackageTotalPrice = (pkg: Package) => {
        return (pkg.products || []).reduce(
            (total, item) => total + calculateProductPrice(item, item.pivot?.quantity, item.pivot?.supply_qty, item.pivot?.install_qty),
            0,
        )
    }

    // const updateQuantity = (id: number, quantity: number) => {
    //     setSelectedPackages((prev: Package[]) =>
    //         prev.map((pkg) => (pkg.id === id ? { ...pkg, quantity: Math.max(1, quantity) } : pkg)),
    //     )
    // }





    const updateProductSupplyQuantity = (productId: number, packageId: number, newSupplyQuantity: number) => {
        const maxAllowed = getMaxSupplyQuantity(productId, packageId);
        const clampedQuantity = Math.max(0, Math.min(newSupplyQuantity, maxAllowed));
        
        const newSelectedPackages = selectedPackages.map((item) =>
            item.id === packageId
                ? {
                    ...item,
                    products: (item.products || []).map((product) =>
                        product.id === productId
                            ? {
                                ...product,
                                pivot: {
                                    ...product.pivot,
                                    supply_qty: clampedQuantity,
                                    includeSupply: clampedQuantity > 0
                                }
                            }
                            : product,
                    ),
                }
                : item,
        );

        setSelectedPackages(newSelectedPackages);
    }

    // Helper function to get maximum allowed quantity for supply_qty
    const getMaxSupplyQuantity = (productId: number, packageId: number) => {
        const product = selectedPackages
            .find(pkg => pkg.id === packageId)
            ?.products?.find(prod => prod.id === productId);
        
        if (!product) return 0;
        
        // Get existing PO deductions for this product
        const deductions = getDeductionPONumbers(packageId, productId, 'supply');
        const totalDeducted = deductions.reduce((sum, d) => sum + d.qty, 0);
        
        // Maximum allowed is base quantity minus existing PO quantities
        const baseQuantity = product.pivot?.quantity || 0;
        return Math.max(0, baseQuantity - totalDeducted);
    }

    // Helper function to get maximum allowed quantity for install_qty
    const getMaxInstallQuantity = (productId: number, packageId: number) => {
        const product = selectedPackages
            .find(pkg => pkg.id === packageId)
            ?.products?.find(prod => prod.id === productId);
        
        if (!product) return 0;
        
        // Get existing PO deductions for this product
        const deductions = getDeductionPONumbers(packageId, productId, 'install');
        const totalDeducted = deductions.reduce((sum, d) => sum + d.qty, 0);
        
        // Maximum allowed is base quantity minus existing PO quantities
        const baseQuantity = product.pivot?.quantity || 0;
        return Math.max(0, baseQuantity - totalDeducted);
    }

    const updateProductInstallQuantity = (productId: number, packageId: number, newInstallQuantity: number) => {
        const maxAllowed = getMaxInstallQuantity(productId, packageId);
        const clampedQuantity = Math.max(0, Math.min(newInstallQuantity, maxAllowed));
        
        const newSelectedPackages = selectedPackages.map((item) =>
            item.id === packageId
                ? {
                    ...item,
                    products: (item.products || []).map((product) =>
                        product.id === productId
                            ? {
                                ...product,
                                pivot: {
                                    ...product.pivot,
                                    install_qty: clampedQuantity,
                                    includeInstall: clampedQuantity > 0
                                }
                            }
                            : product,
                    ),
                }
                : item,
        );

        setSelectedPackages(newSelectedPackages);
    };

    // const removeProduct = (productId: number, packageId?: number) => {
    //     let newSelectedPackages;

    //     if (packageId) {
    //         newSelectedPackages = selectedPackages.map((item) =>
    //             item.id === packageId
    //                 ? {
    //                     ...item,
    //                     products: item.products?.filter((product) => product.id !== productId) || [],
    //                 }
    //                 : item,
    //         );
    //     } else {
    //         newSelectedPackages = [...selectedPackages]

    //         const selectedPackage = newSelectedPackages.find((p) => p.id === activePackageId)

    //         if (selectedPackage) {
    //         selectedPackage.products = selectedPackage.products?.filter((product) => product.id !== productId) || []
    //         }
    //     }

    //     setSelectedPackages(newSelectedPackages);
    // };

    // const removePackage = (packageId: number) => {
    //     const newSelectedPackages = selectedPackages.filter((pkg) => pkg.id !== packageId)
    //     setExpandedSelectedPackages((prev) => {
    //         const newSet = new Set(prev)
    //         newSet.delete(packageId)
    //         return newSet
    //     })
    //     setSelectedPackages(newSelectedPackages)
    // }

    // const handleAddProduct = (packageId: number) => {
    //     setActivePackageId(packageId);
    //     setIsProductSelectorOpen(true);
    // };



    const getTotalSelectedValue = () => {
        return selectedPackages.reduce(
            (total, pkg) =>
                total +
                (pkg.products || []).reduce(
                    (totalProd, item) =>
                        totalProd + (calculateProductPrice(item, item.pivot?.quantity, item.pivot?.supply_qty, item.pivot?.install_qty) * (pkg.quantity || 1)),
                    0,
                ),
            0,
        );
    };

    // Helper function to get existing PO information for display
    const getExistingPOInfo = () => {
        if (existingPurchaseOrders.length === 0) return null;

        return {
            count: existingPurchaseOrders.length,
            totalAmount: existingPurchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0),
            poNumbers: existingPurchaseOrders.map(po => po.po_no).filter(Boolean)
        };
    };

    // Helper function to get PO numbers and quantities that contributed to deduction for a specific product
    const getDeductionPONumbers = (packageId: number, productId: number, deductionType: 'supply' | 'install') => {
        const poDeductions: { po_no: string; qty: number }[] = [];
        
        existingPurchaseOrders.forEach((po: PurchaseOrder) => {
            po.po_packages?.forEach((poPackage: POPackage) => {
                if (String(poPackage.package_id) === String(packageId)) {
                    poPackage.po_items?.forEach((poItem: POItem) => {
                        if (String(poItem.product_id) === String(productId)) {
                            const qty = deductionType === 'supply' ? (poItem.supply_qty || 0) : (poItem.install_qty || 0);
                            if (qty > 0 && po.po_no) {
                                poDeductions.push({ po_no: po.po_no, qty });
                            }
                        }
                    });
                }
            });
        });
        
        return poDeductions;
    };

    const handleGeneratePO = async () => {
        if (selectedPackages.length === 0) {
            notify('error', "Please select at least one package.");
            return;
        }

        if (selectedVendor === null) {
            notify('error', "Please select a vendor.");
            return;
        }

        const poData: PurchaseOrder = {
            sale_id: selectedSale?.id,
            reno_sale_id: selectedSale?.reno_sale_id,
            vendor_id: selectedVendor?.id,
            internal_note: internalNote,
            po_packages: selectedPackages.map(pkg => ({
                package_id: String(pkg.id),
                name: pkg.name,
                quantity: pkg.quantity,
                description: pkg.description,
                description_internal: pkg.description_internal,
                category: pkg.category,
                total_price: calculatePackageTotalPrice(pkg),
                po_items: (pkg.products || []).map(product => ({
                    product_id: String(product.id),
                    product_name: product.name,
                    product_desc: product.description,
                    qty: product.pivot?.quantity || 0,
                    supply_qty: product.pivot?.supply_qty || 0,
                    install_qty: product.pivot?.install_qty || 0,
                    supply_price: product.provisioning?.supply?.cogs || 0,
                    install_price: product.provisioning?.install?.cogs || 0,
                    unit_price: (product.provisioning?.supply?.retail_price || 0) + (product.provisioning?.install?.retail_price || 0),
                    total_price: calculateProductPrice(product, product.pivot?.quantity, product.pivot?.supply_qty, product.pivot?.install_qty),
                }))
            }))
        };

        try {
            const response = await createPurchaseOrder(poData)

            if (response?.success) {
                onCreate(response.data);
                notify("success", "PO Generated Successfully");
            }

        } catch (error) {
            notify("error", "Failed to generate PO");
        } finally {
            // Here you would typically send this data to your API
            onClose()
        }

    }

    if (!isOpen || !sales) return null

    return (
        <>
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isVisible && isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
            >
                <div
                    className={`relative w-full max-h-[90vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 ${isVisible && isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-5 opacity-0"
                        }`}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Generate Purchase Order</h2>
                                <p className="text-sm text-gray-600">Select packages and items to create a purchase order</p>
                            </div>
                        </div>
                        <button
                            onClick={handleBackdropClick}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex h-[calc(90vh-120px)]">
                        {/* Left Panel - Sale Selection & Available Items (Smaller) */}
                        <div className="w-1/5 p-6 border-r border-gray-200/50 overflow-y-auto">
                            {/* Vendor Selection */}
                            <div className="mb-8">
                                <label className="text-sm font-medium text-gray-700 mb-3 block">Select Vendor</label>
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowVendorDropdown(!showVendorDropdown)
                                            setSearchVendorTerm("")
                                            setShowSaleDropdown(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                    >
                                        <span className={selectedVendor ? "text-gray-900" : "text-gray-500"}>
                                            {selectedVendor
                                                ? selectedVendor.name
                                                : "Choose a vendor..."}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    </button>

                                    {showVendorDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-xl z-20 max-h-60 overflow-y-auto overflow-x-hidden"
                                        >
                                            {/* Search and Filter */}
                                            <div className="space-y-4 p-4">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search vendors..."
                                                        value={searchVendorTerm}
                                                        onChange={handleSearchVendor}
                                                        className="w-full pl-12 pr-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                                    />
                                                </div>
                                            </div>
                                            {vendorDropdown.map((vendor, index) => (
                                                <motion.button
                                                    key={index}
                                                    className="w-full p-4 text-left hover:bg-gray-50/80 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                                    onClick={() => handleVendorSelection(vendor)}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <div className="font-medium text-gray-900">{vendor.name}</div>
                                                    <div className="text-sm text-gray-500">{vendor.type}</div>
                                                    {/* <div className="text-xs text-gray-400 capitalize">{sale.status}</div> */}
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Internal Remark */}
                            <div className="mb-8">
                                <label className="text-sm font-medium text-gray-700 mb-3 block">Internal Remark</label>
                                <textarea
                                    name="internal_note"
                                    placeholder="Add internal remark here..."
                                    value={internalNote}
                                    onChange={(e) => setInternalNote(e.target.value)}
                                    className="w-full px-4 py-3 h-24 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 resize-y"
                                />
                            </div>

                            {/* Sale Selection */}
                            <div className="mb-8">
                                <label className="text-sm font-medium text-gray-700 mb-3 block">Select Sale</label>
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowSaleDropdown(!showSaleDropdown)
                                            setShowVendorDropdown(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                    >
                                        <span className={selectedSale ? "text-gray-900" : "text-gray-500"}>
                                            {selectedSale
                                                ? `${selectedSale.sales_no} - RM ${selectedSale.total_amount?.toLocaleString()}`
                                                : "Choose a sale..."}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    </button>

                                    {/* Existing PO Information */}
                                    {selectedSale && getExistingPOInfo() && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-3 mb-3">
                                                <AlertCircle className="h-5 w-5 text-blue-600" />
                                                <span className="text-sm font-semibold text-blue-800">
                                                    Existing Purchase Orders
                                                </span>
                                            </div>
                                            <div className="text-sm text-blue-700 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Count:</span>
                                                    <span>{getExistingPOInfo()?.count} PO(s) already created</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Total Amount:</span>
                                                    <span>RM {getExistingPOInfo()?.totalAmount.toLocaleString()}</span>
                                                </div>
                                                {getExistingPOInfo()?.poNumbers.length > 0 && (
                                                    <div className="flex items-start gap-2">
                                                        <span className="font-medium mt-0.5">PO Numbers:</span>
                                                        <span className="break-all">{getExistingPOInfo()?.poNumbers.join(", ")}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {showSaleDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-xl z-20 max-h-60 overflow-y-auto overflow-x-hidden"
                                        >
                                            {sales.map((sale, index) => (
                                                <motion.button
                                                    key={index}
                                                    className="w-full p-4 text-left hover:bg-gray-50/80 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                                    onClick={() => handleSaleSelection(sale)}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <div className="font-medium text-gray-900">{sale.sales_no}</div>
                                                    <div className="text-sm text-gray-500">
                                                        RM {sale.total_amount?.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-400 capitalize">{sale.status}</div>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>


                        </div>

                        {/* Right Panel - Selected Items with Package Hierarchy (Larger) */}
                        <div className="w-4/5 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 overflow-y-auto">
                            <div className="flex justify-between">
                                <div className="sticky top-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 pb-4 mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                                        Selected Packages & Items
                                    </h3>
                                    {/* <div className="text-sm text-gray-600">
                                {getSelectedPackagesWithItems().length} package
                                {getSelectedPackagesWithItems().length !== 1 ? "s" : ""} selected with{" "}
                                {getSelectedItemsArray().length} item{getSelectedItemsArray().length !== 1 ? "s" : ""}
                            </div> */}
                                </div>
                                {/* <div className="flex flex-col">
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-200 flex items-center gap-2"
                                        onClick={() => setIsPackageSelectorOpen(true)}
                                    >
                                        Add Package
                                    </button>
                                </div> */}
                            </div>

                            {selectedPackages.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <AlertCircle className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No packages selected</h4>
                                    <p className="text-gray-500 text-sm">Select packages from the left panel to configure items</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-6">
                                        {selectedPackages.map((pkg, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden"
                                            >
                                                <div
                                                    className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 cursor-pointer"
                                                    onClick={() => toggleSelectedPackageExpansion(pkg.id)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                                <PackageIcon className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                                                                    {pkg.is_addon && (
                                                                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                                                                            Add-on
                                                                        </span>
                                                                    )}
                                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                                                                        {pkg.category?.replace("_", " ")}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className="text-gray-500">{(pkg.products || []).length} items</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-lg font-semibold">RM {calculatePackageTotalPrice(pkg).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <span>RM {(calculatePackageTotalPrice(pkg)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                            </div>
                                                            {/* <button
                                                                onClick={() => removePackage(pkg.id)}
                                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button> */}
                                                            <button
                                                                onClick={() => toggleSelectedPackageExpansion(pkg.id)}
                                                                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                                            >
                                                                {expandedSelectedPackages.has(pkg.id) ? (
                                                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="h-5 w-5 text-gray-500" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedSelectedPackages.has(pkg.id) && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="border-t border-gray-200/50"
                                                        >
                                                            <div className="p-4">
                                                                {/* Package quantity controls removed */}
                                                                {/* Add Products button removed */}
                                                                <div className="grid grid-cols-11 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 px-2">
                                                                    <div className="col-span-4">Item Details</div>
                                                                    <div className="col-span-1 text-center">BASE QTY</div>
                                                                    <div className="col-span-1 text-center">SUPPLY QTY</div>
                                                                    <div className="col-span-1 text-center">INSTALL QTY</div>
                                                                    <div className="col-span-1 text-right">Supply Total</div>
                                                                    <div className="col-span-1 text-right">Install Total</div>
                                                                    <div className="col-span-1 text-right">Item Total</div>
                                                                    <div className="col-span-1"></div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {(pkg.products || []).map((item, itemIndex) => (
                                                                        <motion.div
                                                                            key={itemIndex}
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: itemIndex * 0.05 }}
                                                                            className="grid grid-cols-11 gap-2 items-center bg-white rounded-xl p-3 border border-gray-200/50 hover:shadow-sm transition-all duration-200"
                                                                        >
                                                                            <div className="col-span-4">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                                                        Item
                                                                                    </span>
                                                                                </div>
                                                                                <h5 className="font-medium text-gray-900 text-sm mb-1 leading-tight">
                                                                                    {item.name}
                                                                                </h5>
                                                                                <div className="space-y-0.5 text-xs text-gray-500">
                                                                                    <div>SKU: {item.SKU}</div>
                                                                                    <span>{item.description || "-"}</span>
                                                                                    {item.supplier_name && <div>Supplier: {item.supplier_name}</div>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-1 flex items-center justify-center">
                                                                                <div className="flex items-center gap-1">
                                                                                    {/* <button
                                                                                        onClick={() =>
                                                                                            updateProductQuantity(item.id!, pkg.id, item.pivot.quantity! - 1)
                                                                                        }
                                                                                        className="h-6 w-6 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200"
                                                                                    >
                                                                                        <Minus className="h-3 w-3" />
                                                                                    </button> */}
                                                                                    <span className="w-8 text-center text-sm font-medium">
                                                                                        {item.pivot?.quantity || 0}
                                                                                    </span>
                                                                                    {/* <button
                                                                                        onClick={() =>
                                                                                            updateProductQuantity(item.id!, pkg.id, item.pivot.quantity! + 1)
                                                                                        }
                                                                                        className="h-6 w-6 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200"
                                                                                    >
                                                                                        <Plus className="h-3 w-3" />
                                                                                    </button> */}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-1 flex items-center justify-center">
                                                                                <div className="flex flex-col items-center">
                                                                                    {(() => {
                                                                                        const deductions = getDeductionPONumbers(pkg.id, item.id!, 'supply');
                                                                                        const totalDeducted = deductions.reduce((sum, d) => sum + d.qty, 0);
                                                                                        const remainingQty = (item.pivot?.quantity || 0) - totalDeducted;
                                                                                        
                                                                                        // If remaining quantity is 0, only show deduction info
                                                                                        if (remainingQty === 0) {
                                                                                            return (
                                                                                                <div className="text-xs text-orange-600 flex flex-col gap-1">
                                                                                                    {deductions.map((d, index) => (
                                                                                                        <span key={index}>
                                                                                                            {d.qty} from {d.po_no}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                        
                                                                                        // Otherwise show controls and deduction info
                                                                                        return (
                                                                                            <>
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            updateProductSupplyQuantity(item.id!, pkg.id, (item.pivot.supply_qty || 0) - 1)
                                                                                                        }
                                                                                                        className="h-6 w-6 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200"
                                                                                                    >
                                                                                                        <Minus className="h-3 w-3" />
                                                                                                    </button>
                                                                                                    <span className={`w-8 text-center text-sm font-medium ${(item.pivot.supply_qty || 0) >= getMaxSupplyQuantity(item.id!, pkg.id) ? 'text-blue-600' : ''}`}>
                                                                                                        {item.pivot.supply_qty || 0}
                                                                                                    </span>
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            updateProductSupplyQuantity(item.id!, pkg.id, (item.pivot.supply_qty || 0) + 1)
                                                                                                        }
                                                                                                        disabled={(item.pivot.supply_qty || 0) >= getMaxSupplyQuantity(item.id!, pkg.id)}
                                                                                                        className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors duration-200 ${(item.pivot.supply_qty || 0) >= getMaxSupplyQuantity(item.id!, pkg.id)
                                                                                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                                                                                                            }`}
                                                                                                    >
                                                                                                        <Plus className="h-3 w-3" />
                                                                                                    </button>
                                                                                                </div>
                                                                                                {/* Show deduction info if quantities were reduced */}
                                                                                                {totalDeducted > 0 && (
                                                                                                    <div className="text-xs text-orange-600 flex flex-col gap-1">
                                                                                                        {deductions.map((d, index) => (
                                                                                                            <span key={index}>
                                                                                                                {d.qty} from {d.po_no}
                                                                                                            </span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-1 flex items-center justify-center">
                                                                                <div className="flex flex-col items-center">
                                                                                    {(() => {
                                                                                        const deductions = getDeductionPONumbers(pkg.id, item.id!, 'install');
                                                                                        const totalDeducted = deductions.reduce((sum, d) => sum + d.qty, 0);
                                                                                        const remainingQty = (item.pivot?.quantity || 0) - totalDeducted;
                                                                                        
                                                                                        // If remaining quantity is 0, only show deduction info
                                                                                        if (remainingQty === 0) {
                                                                                            return (
                                                                                                <div className="text-xs text-orange-600 flex flex-col gap-1">
                                                                                                    {deductions.map((d, index) => (
                                                                                                        <span key={index}>
                                                                                                            {d.qty} from {d.po_no}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                        
                                                                                        // Otherwise show controls and deduction info
                                                                                        return (
                                                                                            <>
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            updateProductInstallQuantity(item.id!, pkg.id, (item.pivot.install_qty || 0) - 1)
                                                                                                        }
                                                                                                        className="h-6 w-6 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200"
                                                                                                    >
                                                                                                        <Minus className="h-3 w-3" />
                                                                                                    </button>
                                                                                                    <span className={`w-8 text-center text-sm font-medium ${(item.pivot.install_qty || 0) >= getMaxInstallQuantity(item.id!, pkg.id) ? 'text-blue-600' : ''}`}>
                                                                                                        {item.pivot.install_qty || 0}
                                                                                                    </span>
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            updateProductInstallQuantity(item.id!, pkg.id, (item.pivot.install_qty || 0) + 1)
                                                                                                        }
                                                                                                        disabled={(item.pivot.install_qty || 0) >= getMaxInstallQuantity(item.id!, pkg.id)}
                                                                                                        className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors duration-200 ${(item.pivot.install_qty || 0) >= getMaxInstallQuantity(item.id!, pkg.id)
                                                                                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                                                                                                            }`}
                                                                                                    >
                                                                                                        <Plus className="h-3 w-3" />
                                                                                                    </button>
                                                                                                </div>
                                                                                                {/* Show deduction info if quantities were reduced */}
                                                                                                {totalDeducted > 0 && (
                                                                                                    <div className="text-xs text-orange-600 flex flex-col gap-1">
                                                                                                        {deductions.map((d, index) => (
                                                                                                            <span key={index}>
                                                                                                                {d.qty} from {d.po_no}
                                                                                                            </span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-1 text-right">
                                                                                <div className="text-sm font-medium text-gray-900">
                                                                                    RM{" "}
                                                                                    {(
                                                                                        (item.provisioning?.supply?.cogs || 0) *
                                                                                        (item.pivot?.supply_qty || 0)
                                                                                    ).toLocaleString()}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {item.pivot?.supply_qty || 0} × RM {(item.provisioning?.supply?.cogs || 0).toLocaleString()}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-1 text-right">
                                                                                <div className="text-sm font-medium text-gray-900">
                                                                                    RM{" "}
                                                                                    {(
                                                                                        (item.provisioning?.install?.cogs || 0) *
                                                                                        (item.pivot?.install_qty || 0)
                                                                                    ).toLocaleString()}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {item.pivot?.install_qty || 0} × RM {(item.provisioning?.install?.cogs || 0).toLocaleString()}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-1 text-right">
                                                                                <div className="text-lg font-semibold text-blue-600">
                                                                                    RM{" "}
                                                                                    {calculateProductPrice(
                                                                                        item,
                                                                                        item.pivot?.quantity,
                                                                                        item.pivot?.supply_qty,
                                                                                        item.pivot?.install_qty,
                                                                                    ).toLocaleString()}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">Total</div>
                                                                            </div>
                                                                            {/* <div className="col-span-1 flex justify-center">
                                                                                <button
                                                                                    onClick={() => removeProduct(item.id!, pkg.id)}
                                                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div> */}
                                                                        </motion.div>
                                                                    ))}
                                                                </div>

                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Summary */}
                                    <div className="border-t border-gray-200/50 pt-4">
                                        <div className="flex justify-between items-center text-xl font-semibold text-gray-900 mb-4">
                                            <span>Total Amount</span>
                                            <span>RM {getTotalSelectedValue().toLocaleString()}</span>
                                        </div>
                                        <button
                                            onClick={handleGeneratePO}
                                            disabled={selectedPackages.length === 0}
                                            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${selectedPackages.length > 0
                                                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                }`}
                                        >
                                            Generate Purchase Order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* <POPackageSelector
                isOpen={isPackageSelectorOpen}
                onClose={() => setIsPackageSelectorOpen(false)}
                selectedPackages={selectedPackages}
                onSelectPackage={handleSelectCustomPackage}
                onRemovePackage={removePackage}
            /> */}

            {/* <POProductModal
                isOpen={isProductSelectorOpen}
                onClose={() => {
                    setIsProductSelectorOpen(false);
                    setActivePackageId(null); // Reset active package
                }}
                selectedProducts={selectedPackages.find(p => p.id === activePackageId)?.products || []}
                onSelectProduct={handleSelectCustomProduct}
                onRemoveProduct={removeProduct}
            /> */}
        </>
    )
}