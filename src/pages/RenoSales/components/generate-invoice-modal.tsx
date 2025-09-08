"use client"

import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { DiscountFee, Invoice, Sale, PurchaseOrder } from "../../../types"
import { createInvoice, fetchDiscountFees } from "../../../services/api"
import { Slide, toast } from "react-toastify"
import Loading from "../../../components/Loading"
import {
    X,
    Calculator,
    Percent,
    DollarSign,
    Tag,
    Plus,
    Trash2,
    Search,
    FileText,
} from "lucide-react"

interface GenerateInvoiceModalProps {
    item: Sale | PurchaseOrder | null
    itemType: 'sale' | 'purchase_order'
    isOpen: boolean
    onClose: () => void
    onGenerate: (itemId: string, newInvoice: Invoice) => void
}

function GenerateInvoiceModal({ item, itemType, isOpen, onClose, onGenerate }: GenerateInvoiceModalProps) {
    const [fees, setFees] = useState([])
    const [discounts, setDiscounts] = useState([])
    const [availableDiscountFees, setAvailableDiscountFees] = useState([])
    const [searchDiscountFeeTerm, setSearchDiscountFeeTerm] = useState('')
    const [selectedType, setSelectedType] = useState<'fee' | 'discount'>('fee')
    const [isDropdownOpen, setIsDropdownOpen] = useState<null | 'fee' | 'discount'>(null)
    const inputDiscountFeeRef = useRef<HTMLInputElement>(null)
    const feeDropdownRef = useRef<HTMLDivElement>(null)
    const discountDropdownRef = useRef<HTMLDivElement>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    const [isOtherPercentage, setIsOtherPercentage] = useState(false)
    const [customeAmountType, setCustomAmountType] = useState<'percentage' | 'amount'>('percentage')
    const [isCustomeValueExceed, setIsCustomeValueExceed] = useState(false)

    const [formData, setFormData] = useState({
        itemId: '',
        percentage: null,
        amount: null,
        invoiceDiscounts: [],
        invoiceFees: [],
    })

    // Helper function to get item properties
    const getItemProperties = () => {
        if (!item) return null
        
        if (itemType === 'sale') {
            const sale = item as Sale
            return {
                id: sale.id,
                number: sale.sales_no,
                totalAmount: sale.total_amount,
                remainingAmount: sale.remaining_amount,
                remainingPercentage: sale.remaining_percentage,
                paidPercentage: sale.paid_percentage
            }
        } else {
            const po = item as PurchaseOrder
            return {
                id: po.id,
                number: po.po_no,
                totalAmount: po.total_amount,
                remainingAmount: po.remaining_amount,
                remainingPercentage: po.remaining_percentage,
                paidPercentage: po.paid_percentage
            }
        }
    }

    const itemProps = useMemo(() => getItemProperties(), [item, itemType])

    const loadDiscountFees = useCallback(async (type?: 'fee' | 'discount') => {
        try {
            const data = await fetchDiscountFees('', 6, type || selectedType)
            setAvailableDiscountFees(data.data)
        } catch (error) {
            console.error('Error fetching available fees:', error)
        }
    }, [selectedType])

    // Handle animation state
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
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            if (feeDropdownRef.current && !feeDropdownRef.current.contains(target) &&
                discountDropdownRef.current && !discountDropdownRef.current.contains(target)) {
                setIsDropdownOpen(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

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
        })
    }

    useEffect(() => {
        if (itemProps) {
            setFormData((prev) => ({
                ...prev,
                itemId: itemProps.id,
            }))
        }

        if (isOpen) {
            loadDiscountFees()
        }
    }, [itemProps, isOpen, loadDiscountFees])

    const handlePercentageSelect = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
        const target = event.currentTarget as HTMLElement

        setIsOtherPercentage(false)

        const percentButton = target.closest('[data-action="percentage"]') as HTMLElement

        if (percentButton) {
            const percentValue = Number(percentButton.dataset.value)
            setFormData((prev) => ({
                ...prev,
                percentage: percentValue
            }))
        }
    }, [])

    const handleOtherPercentage = () => {
        setIsOtherPercentage(true)
        setCustomAmountType('percentage')
    }

    const handleSearchDiscountFee = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value
        setSearchDiscountFeeTerm(term)

        try {
            const data = await fetchDiscountFees(term, 6, selectedType)
            setAvailableDiscountFees(data.data)
        } catch (error) {
            console.error('Error fetching available fees:', error)
        }
    }

    const handleSelectDiscountFee = (discountFee: DiscountFee) => {
        const { name, type, percentage, amount } = discountFee

        const newDiscountFee = {
            name,
            type,
            value: percentage > 0 && percentage !== null ? percentage : amount,
            valueType: percentage > 0 && percentage !== null ? 'percentage' : 'amount',
        }

        if (type === 'discount') {
            setDiscounts((prevDiscounts) => [...prevDiscounts, newDiscountFee])
        } else {
            setFees((prevFees) => [...prevFees, newDiscountFee])
        }

        setIsDropdownOpen(null)
    }

    const handleRemoveFee = (index: number) => {
        const newFees = fees.filter((_, i) => i !== index)
        setFees(newFees)
    }

    const handleRemoveDiscount = (index: number) => {
        const newDiscounts = discounts.filter((_, i) => i !== index)
        setDiscounts(newDiscounts)
    }

    const handleCustomPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!itemProps) return

        const percentage = Number(e.target.value)

        if (percentage > (itemProps.remainingPercentage * 100)) {
            setIsCustomeValueExceed(true)
        } else {
            setIsCustomeValueExceed(false)
        }

        setFormData({
            ...formData,
            percentage: (percentage / 100)
        })
    }

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!itemProps) return

        const amount = Number(e.target.value)
        const percentage = calculatePercentageByAmount(amount)

        if ((percentage * 100) > (itemProps.remainingPercentage * 100)) {
            setIsCustomeValueExceed(true)
        } else {
            setIsCustomeValueExceed(false)
        }

        setFormData({
            ...formData,
            amount: amount,
            percentage: percentage
        })
    }

    const handleSubmit = async () => {
        if (!itemProps) return

        setIsLoading(true)

        if (isCustomeValueExceed) {
            notify('error', 'The amount you entered exceeds balance of the item.')
            setIsLoading(false)
            return
        }

        setFormData((prev) => ({
            ...prev,
            invoiceDiscounts: discounts,
            invoiceFees: fees,
        }))

        const appliedDiscounts = [...discounts]
        const appliedFees = [...fees]

        const newInvoice: Invoice = {
            item_id: itemProps.id,
            percentage: formData.percentage,
            discountsData: JSON.stringify(appliedDiscounts),
            feesData: JSON.stringify(appliedFees),
            item_type: itemType,
        }

        try {
            const response = await createInvoice(newInvoice)

            if (response?.success) {
                onGenerate(itemProps.id.toString(), response.data as Invoice)

                setFees([])
                setDiscounts([])
                setFormData((prev) => ({
                    ...prev,
                    percentage: null
                }))

                onClose()
                notify('success', "Payment Invoice Generated Successfully!")
            } else {
                notify('error', response.message)
                setIsLoading(false)
            }
        } catch (error) {
            console.log(error.message)
            notify('error', 'Error occurred during invoice generation.')
        } finally {
            setIsLoading(false)
        }
    }

    const calculatePercentageByAmount = (amount: number) => {
        if (!itemProps) return 0

        const totalAmount = itemProps.totalAmount
        const calculatedPercentage = (amount / totalAmount)

        return calculatedPercentage
    }

    // Calculate total fees and discounts
    const totalFees = fees.reduce((total, fee) => {
        if (!itemProps || !formData.percentage) return total
        return total + (fee.valueType === 'percentage' ? fee.value * (itemProps.totalAmount * formData.percentage) : fee.value)
    }, 0)

    const totalDiscounts = discounts.reduce((total, discount) => {
        if (!itemProps || !formData.percentage) return total
        return total + (discount.valueType === 'percentage' ? discount.value * (itemProps.totalAmount * formData.percentage) : discount.value)
    }, 0)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", {
            style: "currency",
            currency: "MYR",
            minimumFractionDigits: 2,
        }).format(amount)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!isVisible || !itemProps) return null

    return (
        <>
            {isLoading && <Loading />}

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }

                @keyframes slideIn {
                    from {
                        transform: scale(0.95) translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: scale(0.95) translateY(20px);
                        opacity: 0;
                    }
                }

                .modal-backdrop {
                    animation: ${isOpen ? "fadeIn" : "fadeOut"} 300ms ease-in-out forwards;
                }

                .modal-content {
                    animation: ${isOpen ? "slideIn" : "slideOut"} 300ms ease-in-out forwards;
                }
            `}</style>

            <div
                className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={handleBackdropClick}
            >
                <div className="modal-content relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Calculator className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Generate Invoice</h2>
                                <p className="text-sm text-gray-600">{itemProps.number}</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Item Information & Percentage Selection */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Item Information Card */}
                                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-6 border border-blue-100/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">{itemType === 'sale' ? 'Sale' : 'Purchase Order'} Information</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">{itemType === 'sale' ? 'Sale' : 'PO'} No</span>
                                            <span className="text-sm font-bold text-gray-900">{itemProps.number}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Total Amount</span>
                                            <span className="text-sm font-medium text-gray-900">{formatCurrency(itemProps.totalAmount)}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Remaining Amount</span>
                                            <span className="text-sm font-medium text-gray-900">{formatCurrency(itemProps.remainingAmount)}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Remaining %</span>
                                            <span className="text-sm font-medium text-gray-900">{(itemProps.remainingPercentage * 100).toFixed(2)}%</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Progress</span>
                                            <span className="text-sm font-bold text-emerald-600">{(100 - (itemProps.remainingPercentage * 100)).toFixed(2)}% Complete</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Percentage Selection Card */}
                                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-6 border border-emerald-100/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-emerald-100 rounded-full">
                                            <Percent className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Percentage Selection</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {[1, 0.5, 0.3, 0.2, 0.1].map(value => (
                                                <button
                                                    key={value}
                                                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${formData.percentage === value && !isOtherPercentage
                                                        ? "bg-emerald-600 text-white shadow-lg"
                                                        : value > itemProps.remainingPercentage
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                        }`}
                                                    data-value={value}
                                                    data-action='percentage'
                                                    onClick={handlePercentageSelect}
                                                    disabled={value > itemProps.remainingPercentage}
                                                >
                                                    {value * 100}%
                                                </button>
                                            ))}
                                            <button
                                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${isOtherPercentage
                                                    ? "bg-emerald-600 text-white shadow-lg"
                                                    : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                    }`}
                                                onClick={handleOtherPercentage}
                                            >
                                                Custom
                                            </button>
                                        </div>

                                        {formData.percentage && !isOtherPercentage && (
                                            <div className="p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-900">
                                                    Selected: {(formData.percentage * 100).toFixed(2)}%
                                                </span>
                                            </div>
                                        )}

                                        {isOtherPercentage && (
                                            <div className="space-y-4">
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="customType"
                                                            checked={customeAmountType === "percentage"}
                                                            onChange={() => setCustomAmountType("percentage")}
                                                            className="text-emerald-600"
                                                        />
                                                        <span className="text-sm text-gray-700">By Percentage</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="customType"
                                                            checked={customeAmountType === "amount"}
                                                            onChange={() => setCustomAmountType("amount")}
                                                            className="text-emerald-600"
                                                        />
                                                        <span className="text-sm text-gray-700">By Amount</span>
                                                    </label>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        {customeAmountType === "percentage" ? (
                                                            <Percent className="h-4 w-4 text-gray-400" />
                                                        ) : (
                                                            <DollarSign className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={customeAmountType === "percentage" ? (formData.percentage * 100) || "" : formData.amount || ""}
                                                        onChange={customeAmountType === "percentage" ? handleCustomPercentageChange : handleCustomAmountChange}
                                                        placeholder={customeAmountType === "percentage" ? "Enter percentage" : "Enter amount"}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    />
                                                </div>
                                                {isCustomeValueExceed && (
                                                    <p className="text-sm text-red-600 font-medium">Amount exceeds remaining balance</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Fees, Discounts, and Summary */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Fees Card */}
                                    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl p-6 border border-amber-100/50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-amber-100 rounded-full">
                                                <DollarSign className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Fees</h3>
                                        </div>

                                        <div className="space-y-3">
                                            {fees.length > 0 ? (
                                                fees.map((fee, index) => (
                                                    <div key={index} className="p-4 bg-white/60 rounded-xl border border-amber-100/30">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Name</span>
                                                                <span className="text-sm text-end font-bold text-gray-900">{fee.name}</span>
                                                            </div>

                                                            {fee.valueType === "percentage" && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-600">Rate</span>
                                                                    <span className="text-sm text-end font-medium text-gray-900">
                                                                        {(fee.value * 100).toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Amount</span>
                                                                <span className="text-sm font-bold text-amber-600">
                                                                    +{formatCurrency(
                                                                        fee.valueType === "percentage" ? (itemProps.totalAmount * formData.percentage) * fee.value : fee.value,
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <button
                                                                onClick={() => handleRemoveFee(index)}
                                                                className="w-full p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 bg-white/60 rounded-xl border border-amber-100/30 text-center">
                                                    <span className="text-sm text-gray-600">No fees added</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add Fee Dropdown */}
                                        <div className="mt-4 relative" ref={feeDropdownRef}>
                                            <button
                                                className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:ring-2 ring-amber-500/30 flex items-center justify-center gap-2"
                                                onClick={async () => {
                                                    setSelectedType('fee')
                                                    setIsDropdownOpen(isDropdownOpen === 'fee' ? null : 'fee')
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Fee
                                            </button>

                                            {isDropdownOpen === 'fee' && (
                                                <div className="absolute top-full left-0 right-0 z-50 w-full max-w-80 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 mt-2 overflow-hidden">
                                                    <div className="p-4">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Search className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <input
                                                                ref={inputDiscountFeeRef}
                                                                placeholder="Search Fee"
                                                                type="text"
                                                                value={searchDiscountFeeTerm}
                                                                onChange={handleSearchDiscountFee}
                                                                className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-transparent transition-all duration-200"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {availableDiscountFees.map((availableDiscountFee: DiscountFee, index) => (
                                                            <button
                                                                key={index}
                                                                className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 transition-all duration-200 flex items-center gap-3 group"
                                                                onClick={() => handleSelectDiscountFee(availableDiscountFee)}
                                                            >
                                                                <div className="w-8 h-8 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg flex items-center justify-center group-hover:from-amber-200 group-hover:to-orange-200 transition-all duration-200">
                                                                    <Tag className="h-4 w-4 text-amber-600" />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{availableDiscountFee.name}</span>
                                                            </button>
                                                        ))}
                                                        {availableDiscountFees.length === 0 && (
                                                            <div className="px-4 py-8 text-center">
                                                                <div className="w-12 h-12 bg-gray-100/80 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                    <Search className="w-6 h-6 text-gray-400" />
                                                                </div>
                                                                <p className="text-sm text-gray-500">No fees found</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Discounts Card */}
                                    <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-6 border border-emerald-100/50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-emerald-100 rounded-full">
                                                <Tag className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Discounts</h3>
                                        </div>

                                        <div className="space-y-3">
                                            {discounts.length > 0 ? (
                                                discounts.map((discount, index) => (
                                                    <div key={index} className="p-4 bg-white/60 rounded-xl border border-emerald-100/30">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Name</span>
                                                                <span className="text-sm text-end font-bold text-gray-900">{discount.name}</span>
                                                            </div>

                                                            {discount.valueType === "percentage" && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-600">Rate</span>
                                                                    <span className="text-sm text-end  font-medium text-gray-900">
                                                                        {(discount.value * 100).toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Amount</span>
                                                                <span className="text-sm font-bold text-emerald-600">
                                                                    -{formatCurrency(
                                                                        discount.valueType === "percentage" ? (itemProps.totalAmount * formData.percentage) * discount.value : discount.value,
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <button
                                                                onClick={() => handleRemoveDiscount(index)}
                                                                className="w-full p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 bg-white/60 rounded-xl border border-emerald-100/30 text-center">
                                                    <span className="text-sm text-gray-600">No discounts added</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add Discount Dropdown */}
                                        <div className="mt-4 relative" ref={discountDropdownRef}>
                                            <button
                                                className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:ring-2 ring-emerald-500/30 flex items-center justify-center gap-2"
                                                onClick={async () => {
                                                    setSelectedType('discount')
                                                    setIsDropdownOpen(isDropdownOpen === 'discount' ? null : 'discount')
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Discount
                                            </button>

                                            {isDropdownOpen === 'discount' && (
                                                <div className="absolute top-full left-0 right-0 z-50 w-full max-w-80 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 mt-2 overflow-hidden">
                                                    <div className="p-4">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Search className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <input
                                                                placeholder="Search Discount"
                                                                type="text"
                                                                value={searchDiscountFeeTerm}
                                                                onChange={handleSearchDiscountFee}
                                                                className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent transition-all duration-200"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {availableDiscountFees.map((availableDiscountFee: DiscountFee, index) => (
                                                            <button
                                                                key={index}
                                                                className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200 flex items-center gap-3 group"
                                                                onClick={() => handleSelectDiscountFee(availableDiscountFee)}
                                                            >
                                                                <div className="w-8 h-8 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center group-hover:from-emerald-200 group-hover:to-teal-200 transition-all duration-200">
                                                                    <Tag className="h-4 w-4 text-emerald-600" />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{availableDiscountFee.name}</span>
                                                            </button>
                                                        ))}
                                                        {availableDiscountFees.length === 0 && (
                                                            <div className="px-4 py-8 text-center">
                                                                <div className="w-12 h-12 bg-gray-100/80 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                    <Search className="w-6 h-6 text-gray-400" />
                                                                </div>
                                                                <p className="text-sm text-gray-500">No discounts found</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Card */}
                                {formData.percentage && (
                                    <div className="bg-gradient-to-br from-gray-50/50 to-slate-50/50 rounded-2xl p-6 border border-gray-100/50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-gray-100 rounded-full">
                                                <Calculator className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Base Amount</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(itemProps.totalAmount * formData.percentage)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Total Fees</span>
                                                <span className="text-sm font-medium text-amber-600">
                                                    +{formatCurrency(totalFees)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Total Discounts</span>
                                                <span className="text-sm font-medium text-emerald-600">
                                                    -{formatCurrency(totalDiscounts)}
                                                </span>
                                            </div>

                                            <div className="border-t border-gray-200 pt-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-base font-semibold text-gray-900">Final Invoice Amount</span>
                                                    <span className="text-base font-bold text-gray-900">
                                                        {formatCurrency((itemProps.totalAmount * formData.percentage) + totalFees - totalDiscounts)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 bg-white/95 backdrop-blur-sm border-t border-gray-200/50">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.percentage || isLoading}
                            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Calculator className="h-4 w-4" />
                                    Generate Invoice
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default GenerateInvoiceModal
