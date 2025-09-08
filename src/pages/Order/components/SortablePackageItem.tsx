"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Package, Product } from "../../../types"
import { GripVertical, Trash2, Plus, PackageIcon, ChevronRight } from "lucide-react"
import { ProductTable } from "./ProductTable"
import { motion, AnimatePresence } from "framer-motion"

interface SortablePackageItemProps {
    package: Package;
    index: number;
    tenure?: number;
    quoBePowered?: boolean;
    isRnpl?: boolean;
    onRemove: (id: number) => void;
    onQuantityChange: (id: number, quantity: number) => void;
    onProductsUpdate: (packageId: number, products: Product[]) => void;
    onAddProduct: (packageId: number) => void;
    onAddonToggle?: (packageId: number, isIncluded: boolean) => void;
    onPaymentMethodChange?: (packageId: number, paymentMethod: string, customMonthlyAmount?: number) => void;
    onCustomMonthlyAmountChange?: (packageId: number, customMonthlyAmount: number) => void;
    onMarkupUpdate?: (packageId: number, markupAmount: number, markupPercentage: number) => void;
    onRnplMethodChange?: (packageId: number, method: string) => void;
}

export const SortablePackageItem: React.FC<SortablePackageItemProps> = ({
    package: pkg,
    index,
    tenure,
    quoBePowered,
    isRnpl,
    onRemove,
    onQuantityChange,
    onProductsUpdate,
    onAddProduct,
    onAddonToggle,
    onPaymentMethodChange,
    onCustomMonthlyAmountChange,
    onMarkupUpdate,
    onRnplMethodChange,
}) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [markupAmount, setMarkupAmount] = useState<number>(pkg.markup_amount || 0)
    const [markupPercentage, setMarkupPercentage] = useState<number>(
        pkg.markup_percentage ? pkg.markup_percentage * 100 : 0,
    )
    const [customMonthlyAmount, setCustomMonthlyAmount] = useState<number>(pkg.monthly_amount || 0)
    const [isMarkupAmountManuallyChanged, setIsMarkupAmountManuallyChanged] = useState(false)

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `package-${pkg.id}`,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 1000 : 1,
    }

    const calculatePackageTotal = () => {
        const packageTotal = pkg.products.reduce((prodSum, product) => {
            let supplyPrice = 0
            let installPrice = 0

            // Calculate supply price
            if (product.provisioning?.supply) {
                if (product.pivot?.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1)
                } else {
                    supplyPrice =
                        Math.max(
                            0,
                            (product.provisioning.supply.retail_price || 0) - (product.provisioning.supply.excluded_price || 0),
                        ) * (product.pivot?.quantity || 1)
                }
            }

            // Calculate install price
            if (product.provisioning?.install) {
                if (product.pivot?.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1)
                } else {
                    installPrice =
                        Math.max(
                            0,
                            (product.provisioning.install.retail_price || 0) - (product.provisioning.install.excluded_price || 0),
                        ) * (product.pivot?.quantity || 1)
                }
            }

            return prodSum + supplyPrice + installPrice
        }, 0)

        return packageTotal * (pkg.quantity || 1)
    }

    const calculatePackagePrice = () => {
        const packageTotal = pkg.products.reduce((prodSum, product) => {
            let supplyPrice = 0
            let installPrice = 0

            // Calculate supply price
            if (product.provisioning?.supply) {
                if (product.pivot?.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1)
                } else {
                    supplyPrice =
                        Math.max(
                            0,
                            (product.provisioning.supply.retail_price || 0) - (product.provisioning.supply.excluded_price || 0),
                        ) * (product.pivot?.quantity || 1)
                }
            }

            // Calculate install price
            if (product.provisioning?.install) {
                if (product.pivot?.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1)
                } else {
                    installPrice =
                        Math.max(
                            0,
                            (product.provisioning.install.retail_price || 0) - (product.provisioning.install.excluded_price || 0),
                        ) * (product.pivot?.quantity || 1)
                }
            }

            return prodSum + supplyPrice + installPrice
        }, 0)

        return packageTotal
    }

    const handleAddonToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (pkg.is_addon && onAddonToggle) {
            const newIncludedState = !pkg.is_addon_included
            onAddonToggle(pkg.id!, newIncludedState)
        }
    }

    const handlePaymentMethodChangeInternal = (method: string) => {
        if (onPaymentMethodChange) {
            if (method === "fixed-installation") {
                onPaymentMethodChange(pkg.id!, method, customMonthlyAmount)
            } else {
                onPaymentMethodChange(pkg.id!, method)
            }
        }
    }

    const handleRnplMethodChangeInternal = (method: string) => {
        if (onRnplMethodChange) {
            onRnplMethodChange(pkg.id!, method)
        }
    }

    // Handle markup amount changes
    const handleMarkupAmountChange = (value: number) => {
        setMarkupAmount(value)
        setIsMarkupAmountManuallyChanged(true)
        setMarkupPercentage(0) // Reset percentage when amount changes
        if (onMarkupUpdate) {
            onMarkupUpdate(pkg.id!, value, 0) // Update selectedPackages
        }
    }

    // Handle markup percentage changes
    const handleMarkupPercentageChange = (percentage: number) => {
        setMarkupPercentage(percentage)
        setIsMarkupAmountManuallyChanged(false) // Allow useEffect to update markupAmount
        const originalAmount = calculatePackagePrice()
        const newMarkupAmount = percentage > 0 ? Math.round(originalAmount * (1 + percentage / 100)) : originalAmount
        setMarkupAmount(newMarkupAmount)
        if (onMarkupUpdate) {
            onMarkupUpdate(pkg.id!, newMarkupAmount, percentage) // Update selectedPackages
        }
    }

    // Sync markupAmount with package prop changes, but respect manual changes
    const packageOriginalAmount = calculatePackagePrice()

    useEffect(() => {
        // Only update markupAmount if it hasn't been manually changed and the package's markup_amount has changed
        if (!isMarkupAmountManuallyChanged && pkg.markup_amount !== markupAmount) {
            setMarkupAmount(pkg.markup_amount || packageOriginalAmount)
            setMarkupPercentage(pkg.markup_percentage ? pkg.markup_percentage * 100 : 0)
        }
    }, [pkg.markup_amount, pkg.markup_percentage, packageOriginalAmount, isMarkupAmountManuallyChanged, markupAmount])

    const handleProductToggle = (productId: number, property: "supply" | "install") => {
        if (!pkg.products) return

        const updatedProducts = pkg.products.map((product) => {
            if (product.id === productId) {
                const updatedPivot = {
                    ...product.pivot,
                    [`include${property.charAt(0).toUpperCase() + property.slice(1)}`]:
                        !product.pivot?.[
                        `include${property.charAt(0).toUpperCase() + property.slice(1)}` as keyof typeof product.pivot
                        ],
                }

                updatedPivot.included = updatedPivot.includeSupply || updatedPivot.includeInstall

                return {
                    ...product,
                    pivot: updatedPivot,
                }
            }
            return product
        })

        onProductsUpdate(pkg.id!, updatedProducts)
    }

    const handleQuantityAdjustment = (productId: number, action: "increase" | "decrease") => {
        if (!pkg.products) return

        const updatedProducts = pkg.products.map((product) => {
            if (product.id === productId) {
                const currentQuantity = product.pivot?.quantity || 1
                const newQuantity = action === "increase" ? currentQuantity + 1 : Math.max(1, currentQuantity - 1)

                return {
                    ...product,
                    pivot: {
                        ...product.pivot,
                        quantity: newQuantity,
                    },
                }
            }
            return product
        })

        onProductsUpdate(pkg.id!, updatedProducts)
    }

    const handleRemoveProduct = (productId: number) => {
        if (!pkg.products) return

        const updatedProducts = pkg.products.filter((product) => product.id !== productId)
        onProductsUpdate(pkg.id!, updatedProducts)
    }

    const handleProductVisibilityToggle = (productId: number) => {
        if (!pkg.products) return

        const updatedProducts = pkg.products.map((product) => {
            if (product.id === productId) {
                return {
                    ...product,
                    pivot: {
                        ...product.pivot,
                        visibility: !product.pivot?.visibility,
                    },
                }
            }
            return product
        })

        onProductsUpdate(pkg.id!, updatedProducts)
    }

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded)
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            toggleExpanded()
        }
    }

    const handleHeaderClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (
            target.closest("button") ||
            target.closest("input") ||
            target.closest(".cursor-grab") ||
            target.closest(".cursor-grabbing")
        ) {
            return
        }
        toggleExpanded()
    }

    const handleCustomMonthlyAmountChange = (value: number) => {
        setCustomMonthlyAmount(value)
        if (onCustomMonthlyAmountChange) {
            onCustomMonthlyAmountChange(pkg.id!, value)
        }
    }

    const productCount = pkg.products?.length || 0
    const packageTotal = calculatePackageTotal()
    const isAddonIncluded = pkg.is_addon_included ?? false

    // Calculate financial fields
    const calculatedMonthlyAmount =
        pkg.payment_method === "fixed-installation"
            ? customMonthlyAmount
            : pkg.payment_method === "one-off"
                ? 0
                : tenure && markupAmount > 0
                    ? markupAmount / tenure
                    : 0

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm transition-all duration-200 ${isDragging ? "shadow-lg scale-105" : ""
                } ${pkg.is_addon && !isAddonIncluded ? "opacity-60 bg-gray-50/80" : ""}`}
        >
            {/* Package Header - Always Visible */}
            <div
                className="p-6 cursor-pointer"
                onClick={handleHeaderClick}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`package-details-${pkg.id}`}
                aria-label={`${isExpanded ? "Collapse" : "Expand"} package details for ${pkg.name}`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-grab active:cursor-grabbing transition-colors duration-200 mt-1"
                            aria-label={`Drag to reorder ${pkg.name}`}
                        >
                            <GripVertical className="h-4 w-4 text-gray-500" />
                        </div>

                        {/* Package Index */}
                        <span className="text-md text-gray-500 mt-2">#{index + 1}</span>

                        {/* Package Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <PackageIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                                {pkg.category && (
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border">
                                        {pkg.category}
                                    </span>
                                )}
                            </div>

                            {/* Collapsed Summary Info */}
                            <div className="flex items-center gap-6 mb-2">
                                <ul className="text-md text-gray-500 mt-1">
                                    {pkg?.description?.split("\n").map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Addon Toggle Control */}
                            {pkg.is_addon && (
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-sm text-gray-600">Add-On Quotation:</span>
                                    <button
                                        onClick={handleAddonToggleClick}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isAddonIncluded ? "bg-purple-500" : "bg-gray-200"}`}
                                        aria-label={`${isAddonIncluded ? "Exclude" : "Include"} ${pkg.name} addon package`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${isAddonIncluded ? "translate-x-6" : "translate-x-1"}`}
                                        />
                                    </button>
                                    <span className={`text-sm font-medium ${isAddonIncluded ? "text-purple-700" : "text-gray-500"}`}>
                                        {isAddonIncluded ? "Included" : "Excluded"}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Products: {productCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Package Actions */}
                    <div className="flex">
                        <div className="flex flex-col justify-end items-end">
                            <div className="flex flex-col items-end">
                                <div className="flex gap-6 items-center mb-2">
                                    <div className="flex items-center gap-6">
                                        {quoBePowered || isRnpl ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span>
                                                    RM{" "}
                                                    {markupAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}{" "}
                                                    (Markup Price)
                                                </span>
                                                <span>x</span>
                                                <span>{pkg.quantity || 1} (Qty)</span>
                                                <span>=</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span>
                                                    RM{" "}
                                                    {(packageTotal / (pkg.quantity || 1)).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}{" "}
                                                    (Unit Price)
                                                </span>
                                                <span>x</span>
                                                <span>{pkg.quantity || 1} (Qty)</span>
                                                <span>=</span>
                                            </div>
                                        )}
                                    </div>
                                    {quoBePowered || isRnpl ? (
                                        <div
                                            className={`text-lg font-semibold ${pkg.is_addon && !isAddonIncluded ? "text-gray-400 line-through" : "text-gray-900"}`}
                                        >
                                            RM{" "}
                                            {(markupAmount * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </div>
                                    ) : (
                                        <div
                                            className={`text-lg font-semibold ${pkg.is_addon && !isAddonIncluded ? "text-gray-400 line-through" : "text-gray-900"}`}
                                        >
                                            RM{" "}
                                            {packageTotal.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </div>
                                    )}
                                </div>
                                {pkg.is_addon && !isAddonIncluded && (
                                    <div className="text-xs text-amber-600 mb-2">⚠ Not included in total</div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-8">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRemove(pkg.id!)
                                    }}
                                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    aria-label={`Remove ${pkg.name} package`}
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Remove
                                </button>
                            </div>
                        </div>

                        {/* Expand/Collapse Indicator */}
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-all duration-200"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        id={`package-details-${pkg.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.4, 0.0, 0.2, 1],
                        }}
                        className="overflow-hidden border-t border-gray-200/50"
                    >
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            exit={{ y: -20 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="p-6"
                        >
                            {/* Addon Package Notice */}
                            {pkg.is_addon && !isAddonIncluded && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <span className="text-sm font-medium">⚠ This addon package is excluded from the order</span>
                                    </div>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Toggle the switch above to include it in pricing calculations.
                                    </p>
                                </div>
                            )}

                            {/* Package Controls */}
                            <div className="flex justify-between items-center gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Quantity:</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onQuantityChange(pkg.id!, Math.max(1, (pkg.quantity || 1) - 1))}
                                            className={`h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                            aria-label="Decrease quantity"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{pkg.quantity || 1}</span>
                                        <button
                                            onClick={() => onQuantityChange(pkg.id!, (pkg.quantity || 1) + 1)}
                                            className={`h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onAddProduct(pkg.id!)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg 
                                            bg-blue-500 text-white border border-blue-500 
                                            hover:bg-blue-600 hover:border-blue-600 
                                            transition-all duration-200 
                                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                    aria-label={`Add products to ${pkg.name}`}
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Products
                                </button>
                            </div>

                            {/* BePowered Details Section */}
                            {quoBePowered &&
                                <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white border rounded-xl p-4 mb-4 transition-all duration-300">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h2 className="text-lg font-semibold text-gray-800 mr-4">Installment Details</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Original Amount Section - Always Displayed */}
                                            <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3-.672 3-1.5S13.657 8 12 8zm0 0c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0V6m0 12v2"
                                                        />
                                                    </svg>
                                                    <span className="text-xs font-semibold text-gray-700">Original Amount</span>
                                                </div>
                                                <span className="text-sm font-bold text-blue-700">
                                                    RM{" "}
                                                    {packageOriginalAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>

                                            {/* Other Sections - Displayed only if pkg.payment_method !== 'base-price' */}
                                            {pkg.payment_method !== "base-price" ? (
                                                <>
                                                    <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                            </svg>
                                                            <span className="text-xs font-semibold text-gray-700">Markup Amount</span>
                                                        </div>
                                                        <div className="flex items-center bg-white rounded-lg p-2 border border-gray-300">
                                                            <span className="text-sm font-bold text-orange-700 mr-1">RM</span>
                                                            <input
                                                                type="number"
                                                                value={markupAmount}
                                                                onChange={(e) => handleMarkupAmountChange(Number(e.target.value))}
                                                                className="w-full text-sm font-bold text-orange-700 bg-transparent border-none outline-none"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                            </svg>
                                                            <span className="text-xs font-semibold text-gray-700">Markup %</span>
                                                        </div>
                                                        <div className="flex items-center bg-white rounded-lg p-2 border border-gray-300">
                                                            <input
                                                                type="number"
                                                                value={markupPercentage}
                                                                onChange={(e) => handleMarkupPercentageChange(Number(e.target.value))}
                                                                className="w-full text-sm font-bold text-purple-700 bg-transparent border-none outline-none"
                                                                placeholder="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </div>

                                                    {tenure > 0 && (
                                                        <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                    />
                                                                </svg>
                                                                <span className="text-xs font-semibold text-gray-700">Tenure</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-indigo-700">{tenure} months</span>
                                                        </div>
                                                    )}

                                                    {pkg.payment_method !== "one-off" && (
                                                        <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                                <span className="text-xs font-semibold text-gray-700">Monthly Amount</span>
                                                            </div>
                                                            {pkg.payment_method === "fixed-installation" ? (
                                                                <div className="flex items-center bg-white rounded-lg p-2 border border-gray-300">
                                                                    <span className="text-sm font-bold text-teal-700 mr-1">RM</span>
                                                                    <input
                                                                        type="number"
                                                                        value={pkg.monthly_amount}
                                                                        onChange={(e) => handleCustomMonthlyAmountChange(Number(e.target.value))}
                                                                        className="w-full text-sm font-bold text-teal-700 bg-transparent border-none outline-none"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm font-bold text-teal-700">
                                                                    RM{" "}
                                                                    {calculatedMonthlyAmount.toLocaleString(undefined, {
                                                                        minimumFractionDigits: 0,
                                                                        maximumFractionDigits: 0,
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3-.672 3-1.5S13.657 8 12 8zm0 0c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0V6m0 12v2"
                                                            />
                                                        </svg>
                                                        <span className="text-xs font-semibold text-gray-700">Note</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-orange-700">
                                                        This package pricing will not include in Upfront Amount
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Installment Status Section */}
                                    <div className="flex flex-col min-w-0">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Config</h2>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[200px] transition-all duration-200 hover:bg-gray-100">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <svg
                                                        className="w-4 h-4 text-blue-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3-.672 3-1.5S13.657 8 12 8zm0 0c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0V6m0 12v2"
                                                        />
                                                    </svg>
                                                    <span className="text-xs font-semibold text-gray-700">Payment Method</span>
                                                </div>
                                                <select
                                                    className="w-full text-sm font-semibold text-blue-700 bg-white border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                    value={pkg.payment_method}
                                                    onChange={(e) => {
                                                        const method = e.target.value as "one-off" | "base-price" | "fixed-installation" | "dynamic-installation"
                                                        handlePaymentMethodChangeInternal(method)
                                                    }}
                                                >
                                                    <option value="one-off">One-off</option>
                                                    <option value="base-price">Base Price</option>
                                                    <option value="fixed-installation">Fixed Installment</option>
                                                    <option value="dynamic-installation">Dynamic Installment</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }

                            {/* RenoNow PayLater Section */}
                            {isRnpl &&
                                <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white border rounded-xl p-4 mb-4 transition-all duration-300">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h2 className="text-lg font-semibold text-gray-800 mr-4">RenoNow PayLater Config</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[200px] transition-all duration-200 hover:bg-gray-100">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <svg
                                                        className="w-4 h-4 text-blue-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3-.672 3-1.5S13.657 8 12 8zm0 0c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0V6m0 12v2"
                                                        />
                                                    </svg>
                                                    <span className="text-xs font-semibold text-gray-700">Payment Method</span>
                                                </div>
                                                <select
                                                    className="w-full text-sm font-semibold text-blue-700 bg-white border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                    value={pkg.rnpl_method || "pay-later"}
                                                    onChange={(e) => {
                                                        const method = e.target.value as "reno-now" | "pay-later"
                                                        handleRnplMethodChangeInternal(method)
                                                    }}
                                                >
                                                    <option value="reno-now">RenoNow</option>
                                                    <option value="pay-later">PayLater</option>
                                                </select>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                    <span className="text-xs font-semibold text-gray-700">Markup Amount</span>
                                                </div>
                                                <div className="flex items-center bg-white rounded-lg p-2 border border-gray-300">
                                                    <span className="text-sm font-bold text-orange-700 mr-1">RM</span>
                                                    <input
                                                        type="number"
                                                        value={markupAmount}
                                                        onChange={(e) => handleMarkupAmountChange(Number(e.target.value))}
                                                        className="w-full text-sm font-bold text-orange-700 bg-transparent border-none outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px] transition-all duration-200 hover:bg-gray-100">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                    <span className="text-xs font-semibold text-gray-700">Markup %</span>
                                                </div>
                                                <div className="flex items-center bg-white rounded-lg p-2 border border-gray-300">
                                                    <input
                                                        type="number"
                                                        value={markupPercentage}
                                                        onChange={(e) => handleMarkupPercentageChange(Number(e.target.value))}
                                                        className="w-full text-sm font-bold text-purple-700 bg-transparent border-none outline-none"
                                                        placeholder="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }

                            {/* Products Table */}
                            {pkg.products && pkg.products.length > 0 ? (
                                <ProductTable
                                    products={pkg.products}
                                    packageId={pkg.id!}
                                    packageQty={pkg.quantity || 1}
                                    onProductsUpdate={onProductsUpdate}
                                    onToggleProperty={handleProductToggle}
                                    onQuantityAdjust={handleQuantityAdjustment}
                                    onRemoveProduct={handleRemoveProduct}
                                    onToggleVisibility={handleProductVisibilityToggle}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <div className="p-4 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                                        <PackageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-3">No products in this package</p>
                                    <button
                                        onClick={() => onAddProduct(pkg.id!)}
                                        disabled={pkg.is_addon && !isAddonIncluded}
                                        className={`text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 ${pkg.is_addon && !isAddonIncluded ? "opacity-50 cursor-not-allowed text-gray-400" : ""}`}
                                    >
                                        Add your first product
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}