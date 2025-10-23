import type React from "react"
import { useEffect, useState } from "react"
import {
    X,
    Copy,
    Trash2,
    CreditCard,
    Calendar,
    DollarSign,
    FileText,
    Tag,
    Receipt,
    CheckCircle,
    Clock,
    AlertCircle,
} from "lucide-react"
import type { Invoice, Payment } from "../../../types"
import NewPaymentDetailModal from "./new-payment-detail-modal"
import PaymentDetailModal from "./payment-detail-modal"
import { useRenoSale } from "../../../context/context"
import { useSearchParams } from "react-router-dom"

interface InvoiceDetailModalProps {
    invoice: Invoice | null
    itemId: string
    itemType: 'sale' | 'purchase_order'
    totalAmount: number // Add this prop to receive the total amount from parent
    isOpen: boolean
    onClose: () => void
    onMarkAsPaid?: (itemId: string, invoiceId: string, paymentData: Payment) => Promise<boolean>
    onDelete?: (invoice: Invoice) => void
}

export default function InvoiceDetailModal({
    invoice,
    itemId,
    itemType,
    totalAmount,
    isOpen,
    onClose,
    onMarkAsPaid,
    onDelete,
}: InvoiceDetailModalProps) {
    const [linkCopied, setLinkCopied] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [isNewPaymentDetailModalOpen, setIsNewPaymentDetailModalOpen] = useState(false)
    const [isPaymentDetailModalOpen, setIsPaymentDetailModalOpen] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

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

    useEffect(() => {
        const paymentId = searchParams.get('payment')

        if (paymentId) {
            setIsPaymentDetailModalOpen(true)
        }
    }, [searchParams, invoice])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", {
            style: "currency",
            currency: "MYR",
            minimumFractionDigits: 2,
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "pending":
                return "bg-amber-100 text-amber-800 border-amber-200"
            case "overdue":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "paid":
                return <CheckCircle className="h-4 w-4" />
            case "pending":
                return <Clock className="h-4 w-4" />
            case "overdue":
                return <AlertCircle className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    const handleViewPayment = (paymentId: string) => {
        setSelectedPayment(invoice?.payments?.find((payment) => payment.id === paymentId) || null)

        setSearchParams((prev) => {
            prev.set('payment', paymentId)
            return prev
        })
    }

    const handleCopyLink = async () => {
        if (!invoice) return

        const paymentLink = `${window.location.origin}/invoice/${invoice.id}/view`

        try {
            await navigator.clipboard.writeText(paymentLink)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy link:", err)
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const handleClosePaymentDetailModal = () => {
        setIsPaymentDetailModalOpen(false)
        setSearchParams((prev) => {
            prev.delete('payment')
            return prev
        })
    }

    const handleSavePayment = async (invoiceId: string, paymentData: Payment): Promise<boolean> => {
        try {
            const success = await onMarkAsPaid?.(itemId, invoiceId, paymentData)
            if (success) {
                setIsNewPaymentDetailModalOpen(false)
            }
        } catch (error) {
            console.error("Failed to save payment:", error)
            return false
        }
        return true
    }

    if (!isVisible || !invoice) return null

    return (
        <>
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
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                                <p className="text-sm text-gray-600">{invoice.invoice_no}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {invoice.status === "unpaid" && (
                                <button
                                    onClick={() => setIsNewPaymentDetailModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors duration-200 flex items-center gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Mark as Paid
                                </button>
                            )}

                            <button
                                onClick={() => onDelete(invoice)}
                                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full transition-colors duration-200 flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - General Info */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-6 border border-blue-100/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <Receipt className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">General Information</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Invoice No</span>
                                            <span className="text-sm font-bold text-gray-900">{invoice.invoice_no}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Initial Billed Amount</span>
                                            <span className="text-sm font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Amount</span>
                                            <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amount)}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Due Date</span>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Status</span>
                                            <div
                                                className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(invoice.status)}`}
                                            >
                                                {getStatusIcon(invoice.status)}
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Version</span>
                                            <span className="text-sm font-medium text-gray-900">v{invoice.version || "1.0"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl p-6 border border-purple-100/50 hidden">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <Copy className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Payment Link</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-xl border border-gray-200">
                                            <input
                                                type="text"
                                                value={`${window.location.origin}/invoice/${invoice.id}/view`}
                                                readOnly
                                                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                                            />
                                            <button
                                                onClick={handleCopyLink}
                                                className={`p-2 rounded-lg transition-colors duration-200 ${linkCopied ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {linkCopied && <p className="text-sm text-emerald-600 font-medium">Link copied to clipboard!</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Discounts, Fees, and Payments */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-6 border border-emerald-100/50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-emerald-100 rounded-full">
                                                <Tag className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Discounts</h3>
                                        </div>

                                        <div className="space-y-3">
                                            {invoice.discountsData && Array.isArray(invoice.discountsData) && invoice.discountsData.length > 0 ? (
                                                invoice.discountsData.map((discount, index) => (
                                                    <div key={index} className="p-4 bg-white/60 rounded-xl border border-emerald-100/30">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Name</span>
                                                                <span className="text-sm font-bold text-gray-900">{discount.name}</span>
                                                            </div>

                                                            {discount.valueType === "percentage" && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-600">Rate</span>
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {(discount.value * 100).toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Amount</span>
                                                                <span className="text-sm font-bold text-emerald-600">
                                                                    -{formatCurrency(
                                                                        discount.valueType === "percentage"
                                                                            ? invoice.amount * discount.value
                                                                            : discount.value,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 bg-white/60 rounded-xl border border-emerald-100/30 text-center">
                                                    <span className="text-sm text-gray-600">No discounts applied</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl p-6 border border-amber-100/50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-amber-100 rounded-full">
                                                <DollarSign className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Fees</h3>
                                        </div>

                                        <div className="space-y-3">
                                            {invoice.feesData && Array.isArray(invoice.feesData) && invoice.feesData.length > 0 ? (
                                                invoice.feesData.map((fee, index) => (
                                                    <div key={index} className="p-4 bg-white/60 rounded-xl border border-amber-100/30">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Name</span>
                                                                <span className="text-sm font-bold text-gray-900">{fee.name}</span>
                                                            </div>

                                                            {fee.valueType === "percentage" && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-600">Rate</span>
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {(fee.value * 100).toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-600">Amount</span>
                                                                <span className="text-sm font-bold text-amber-600">
                                                                    +{formatCurrency(
                                                                        fee.valueType === "percentage" ? invoice.amount * fee.value : fee.value,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 bg-white/60 rounded-xl border border-amber-100/30 text-center">
                                                    <span className="text-sm text-gray-600">No fees applied</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-gray-50/50 to-slate-50/50 rounded-2xl p-6 border border-gray-100/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-gray-100 rounded-full">
                                            <CreditCard className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Payment Transactions</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {invoice.payments && invoice.payments.length > 0 ? (
                                            invoice.payments.map((payment, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-gray-100/30 hover:bg-white/80 transition-colors duration-200 cursor-pointer"
                                                    onClick={() => handleViewPayment(payment.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <CreditCard className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{payment.transaction_no}</p>
                                                            <p className="text-xs text-gray-600">
                                                                {payment.payment_date ? formatDate(payment.payment_date) : "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                                            <span className="text-xs text-emerald-600">Completed</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 bg-white/60 rounded-xl border border-gray-100/30 text-center">
                                                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                                                    <CreditCard className="h-6 w-6 text-gray-500" />
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">No payments recorded</p>
                                                <p className="text-xs text-gray-500">Payments will appear here once processed</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <NewPaymentDetailModal
                invoiceId={invoice?.id}
                isOpen={isNewPaymentDetailModalOpen}
                onClose={() => setIsNewPaymentDetailModalOpen(false)}
                onSave={handleSavePayment}
            />

            <PaymentDetailModal
                paymentId={searchParams.get('payment')}
                payment={selectedPayment}
                isOpen={isPaymentDetailModalOpen}
                onClose={handleClosePaymentDetailModal}
            />
        </>
    )
}