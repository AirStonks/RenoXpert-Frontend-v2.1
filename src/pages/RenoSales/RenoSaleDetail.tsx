"use client"

import { useEffect, useState } from "react"
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Building,
    FileText,
    ShoppingCart,
    Package,
    Clock,
    TrendingUp,
    Download,
    Eye,
    Plus,
    ChevronDown,
    ChevronRight,
    Receipt,
    Calendar,
    DollarSign,
} from "lucide-react"
import type { Invoice, PurchaseOrder, RenoXSale, Sale } from "../../types"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import useFetchRenoSale from "../../hook/useFetchRenoSale"
import { Link, useLocation } from "react-router-dom"
import InvoiceDetailModal from "./components/invoice-detail-modal"
import CreatePOModal from "./components/create-po-modal"
import GenerateInvoiceModal from "./components/generate-invoice-modal"
import { Payment } from "../../types"
import { saveInvoiceDetail } from "../../services/api"
import { RenoSaleContext } from "../../context/context"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

// Skeleton component for shimmering effect
const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
)

// Reusable: Payment summary panel
const PaymentSummaryPanel = ({
    title,
    percentage = 0,
    paidAmount = 0,
    totalAmount = 0,
}: {
    title: string
    percentage?: number
    paidAmount?: number
    totalAmount?: number
}) => {
    const currency = (v: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 2 }).format(v || 0)
    const remaining = (totalAmount || 0) - (paidAmount || 0)
    return (
        <div className="flex flex-col w-full">
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 text-lg font-semibold mb-6">
                    <div className="p-2 bg-amber-50 rounded-full">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                    {title}
                </div>
            </div>
            <div className="px-6 pb-6 space-y-6">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - (percentage || 0))}`} className="text-emerald-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900">{Math.round((percentage || 0) * 100)}%</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Paid Amount</span>
                        <span className="font-bold text-emerald-600">{currency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Total Amount</span>
                        <span className="font-bold text-gray-900">{currency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50/50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Remaining</span>
                        <span className="font-bold text-amber-600">{currency(remaining)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Reusable: Invoice list view
const InvoiceListView = ({
    item,
    invoices,
    onViewInvoice,
    onGenerate,
    showGenerateButton = true,
    generateLabel = "Generate New Invoice",
}: {
    invoices: Invoice[]
    item: Sale | PurchaseOrder
    onViewInvoice: (invoice: Invoice, item: Sale | PurchaseOrder) => void
    onGenerate?: () => void
    showGenerateButton?: boolean
    generateLabel?: string
}) => {
    const currency = (v: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 2 }).format(v || 0)
    const format = (d?: string) => (d ? new Date(d).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" }) : "-")
    const statusClass = (status?: string) => {
        switch (status) {
            case "active":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            case "pending":
                return "bg-amber-50 text-amber-700 border-amber-200"
            case "paid":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            case "overdue":
                return "bg-red-50 text-red-700 border-red-200"
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200"
            default:
                return "bg-gray-50 text-gray-700 border-gray-200"
        }
    }
    return (
        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-white/70 rounded-xl border border-white/80 overflow-hidden">
                <div className="px-6 py-3 bg-white/50 border-b border-gray-200/50">
                    <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div>Invoice Details</div>
                        <div>Due Date</div>
                        <div>Amount</div>
                        <div>Status</div>
                        <div className="text-right">Actions</div>
                    </div>
                </div>
                <div className="divide-y divide-gray-200/50">
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className="px-6 py-4 hover:bg-white/50 transition-colors duration-200">
                            <div className="grid grid-cols-5 gap-4 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <FileText className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h6 className="font-semibold text-gray-900 text-sm">{invoice.invoice_no}</h6>
                                        <p className="text-xs text-gray-600">Invoice Number</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <Calendar className="h-3 w-3 text-gray-500" />
                                        <span>{format(invoice.due_date)}</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Due Date</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{currency(invoice.amount || 0)}</p>
                                    <p className="text-xs text-gray-600">Amount</p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass(invoice.status)}`}>{invoice.status}</span>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-white/60 hover:bg-white/80 border border-gray-200 rounded-full transition-colors duration-200 flex items-center gap-1 opacity-50 cursor-not-allowed">
                                        <Download className="h-3 w-3" />
                                        PDF
                                    </button>
                                    <button
                                        onClick={() => onViewInvoice(invoice, item)}
                                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white/60 hover:bg-white/80 border border-gray-200 rounded-full transition-colors duration-200 flex items-center gap-1"
                                    >
                                        <Eye className="h-3 w-3" />
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {showGenerateButton && (
                    <div className="px-6 py-4 bg-white/30 border-t border-gray-200/50">
                        <button onClick={onGenerate} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white/60 hover:bg-white/80 border-2 border-dashed border-gray-300 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                            <Plus className="h-4 w-4" />
                            {generateLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function RenoSaleDetail() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const renoSaleId = id ? Number.parseInt(id, 10) : null
    const [renoSale, setRenoSale] = useState<RenoXSale>({})
    const [activeTab, setActiveTab] = useState("sales-orders")
    const [expandedSales, setExpandedSales] = useState<string[]>([])
    const [expandedPurchaseOrders, setExpandedPurchaseOrders] = useState<string[]>([])

    // Modal states
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false)
    const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false)
    const [selectedItemTotalAmount, setSelectedItemTotalAmount] = useState<number>(0)
    const [selectedItemType, setSelectedItemType] = useState<'sale' | 'purchase_order'>('sale')
    const [selectedItem, setSelectedItem] = useState<Sale | PurchaseOrder | null>(null)

    // URL parameter handling
    const [searchParams, setSearchParams] = useSearchParams()

    const { renoSaleDetail, loading, error } = useFetchRenoSale(renoSaleId)
    const location = useLocation()

    useEffect(() => {
        document.title = "Reno Sale Detail | RenoXpert"

        if (renoSaleDetail) {
            setRenoSale(renoSaleDetail)
            setExpandedSales(renoSaleDetail.sales?.map((sale) => sale.id) || [])
            setExpandedPurchaseOrders(renoSaleDetail.purchase_orders?.map((po) => po.id) || [])
        }
    }, [renoSaleDetail])

    // Show invoice modal if invoice parameter is present
    useEffect(() => {

        const saleId = searchParams.get('sale')
        const poId = searchParams.get('po')
        const invoiceId = searchParams.get('invoice')

        if (invoiceId && renoSale) {
            if (saleId) {
                const invoice = renoSale?.sales
                    ?.find((sale) => Number(sale.id) === Number(saleId))
                    ?.invoices?.find((inv) => Number(inv.id) === Number(invoiceId));

                if (invoice) {
                    setSelectedItem(renoSale?.sales?.find((sale) => Number(sale.id) === Number(saleId)))
                    setSelectedInvoice(invoice);
                    setIsInvoiceModalOpen(true);
                    
                }
            } else if (poId) {
                const invoice = renoSale?.purchase_orders
                    ?.find((po) => Number(po.id) === Number(poId))
                    ?.invoices?.find((inv) => Number(inv.id) === Number(invoiceId));

                if (invoice) {
                    setSelectedItem(renoSale?.purchase_orders?.find((po) => Number(po.id) === Number(poId)))
                    setSelectedInvoice(invoice);
                    setIsInvoiceModalOpen(true);
                }
            }
        }
    }, [searchParams, renoSale])


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
            case "active":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            case "pending":
                return "bg-amber-50 text-amber-700 border-amber-200"
            case "paid":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            case "overdue":
                return "bg-red-50 text-red-700 border-red-200"
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200"
            default:
                return "bg-gray-50 text-gray-700 border-gray-200"
        }
    }

    const getSaleStatus = (status: string) => {
        if (status === 'partial-paid') return 'Partial Paid'
        if (status === 'issued') return 'Issued'
        if (status === 'fully-paid') return 'Fully Paid'
        return status
    }

    const getSaleStatusColor = (status: string) => {
        switch (status) {
            case "partial-paid":
                return "bg-purple-50 text-purple-700 border-purple-200"
            case "issued":
                return "bg-blue-50 text-blue-700 border-blue-200"
            case "fully-paid":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            default:
                return "bg-gray-50 text-gray-700 border-gray-200"
        }
    }

    const toggleSaleExpansion = (saleId: string) => {
        setExpandedSales((prev) => (prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]))
    }

    const togglePurchaseOrderExpansion = (purchaseOrderId: string) => {
        setExpandedPurchaseOrders((prev) => (prev.includes(purchaseOrderId) ? prev.filter((id) => id !== purchaseOrderId) : [...prev, purchaseOrderId]))
    }

    const calculateInvoiceTotals = (invoices: Invoice[]) => {
        const paidInvoices = invoices?.filter((inv) => inv.status === "paid") || []
        const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        const totalAmount = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0
        return { paidAmount, totalAmount }
    }

    // Modal handlers
    const handleViewInvoice = (invoice: Invoice, item: Sale | PurchaseOrder, itemType: 'sale' | 'purchase_order') => {
        if (itemType === 'sale') {
            setSearchParams({ sale: invoice.item_id || '', invoice: invoice.id || '' })
            setSelectedItemTotalAmount(item.total_amount * (invoice.percentage))
            setSelectedItemType(itemType)
        } else {
            setSearchParams({ po: invoice.item_id || '', invoice: invoice.id || '' })
            setSelectedItemTotalAmount(item.total_amount * (invoice.percentage))
            setSelectedItemType(itemType)
        }
    }

    const handleCloseInvoiceModal = () => {
        setIsInvoiceModalOpen(false)
        setSelectedInvoice(null)
        setSearchParams({})
    }

    const handleMarkAsPaid = async (itemId: string, invoiceId: string, paymentData: Payment) => {
        try {
            const response = await saveInvoiceDetail(
                Number(paymentData.invoice_id),
                paymentData,
                paymentData.attachments as File[]
            );

            if (!response?.success) return;

            const updateInvoices = (invoices: Invoice[] = []) =>
                invoices.map(invoice =>
                    Number(invoice.id) === Number(invoiceId)
                        ? {
                            ...invoice,
                            status: 'paid',
                            payments: [
                                ...(invoice.payments || []),
                                paymentData,
                            ],
                        }
                        : invoice
                );

            if (selectedItemType === 'sale') {
                setRenoSale(prev => ({
                    ...prev,
                    sales: prev.sales?.map(sale =>
                        Number(sale.id) === Number(itemId)
                            ? { ...sale, invoices: updateInvoices(sale.invoices) }
                            : sale
                    ),
                }));
            } else {
                setRenoSale(prev => ({
                    ...prev,
                    purchase_orders: prev.purchase_orders?.map(po =>
                        Number(po.id) === Number(itemId)
                            ? { ...po, invoices: updateInvoices(po.invoices) }
                            : po
                    ),
                }));
            }
        } catch (error) {
            console.error("Failed to save payment:", error);
            return false;
        }
    }

    const handleDeleteInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setIsInvoiceModalOpen(false)
        // Remove invoice parameter from URL
        setSearchParams({})
    }

    const handleGenerateInvoice = (item: Sale | PurchaseOrder, itemType: 'sale' | 'purchase_order') => {
        setSelectedItem(item)
        setSelectedItemType(itemType)
        setIsGenerateInvoiceModalOpen(true)
    }

    const handleCreatePo = () => {
        setIsCreatePoModalOpen(true)
    }

    const handleNewPo = (purchaseOrder: PurchaseOrder) => {
        const updatedRenoSale: RenoXSale = {
            ...renoSale,
            purchase_orders: [
                ...(renoSale.purchase_orders || []),
                purchaseOrder
            ]
        };

        setRenoSale(updatedRenoSale);
    };

    const handleCloseGenerateInvoiceModal = () => {
        setIsGenerateInvoiceModalOpen(false)
        setSelectedItem(null)
    }

    const handleInvoiceGenerated = (itemId: string, newInvoice: Invoice) => {
        if (selectedItemType === 'sale') {
            // Always use the latest renoSale state
            setRenoSale(prevRenoSale => {
                const updatedSales = prevRenoSale.sales?.map(sale =>
                    Number(sale.id) === Number(itemId) ? {
                        ...sale,
                        invoices: [
                            ...(sale.invoices || []),
                            newInvoice
                        ],
                        remaining_amount: sale.remaining_amount - (sale.total_amount * (newInvoice.percentage)),
                        remaining_percentage: sale.remaining_percentage - newInvoice.percentage
                    } : sale
                ) || [];

                return {
                    ...prevRenoSale,
                    sales: updatedSales
                };
            });
        } else {
            setRenoSale(prevRenoSale => {
                const updatedPurchaseOrders = prevRenoSale.purchase_orders?.map(po =>
                    Number(po.id) === Number(itemId) ? {
                        ...po,
                        invoices: [
                            ...(po.invoices || []),
                            newInvoice
                        ],
                        remaining_amount: po.total_amount - (po.total_amount * (newInvoice.percentage)),
                        remaining_percentage: po.remaining_percentage - newInvoice.percentage
                    } : po
                ) || [];

                return {
                    ...prevRenoSale,
                    purchase_orders: updatedPurchaseOrders
                };
            });
        }

        handleCloseGenerateInvoiceModal()
    }


    // Reserved for future integrations (delete, save payment, generate invoice)

    // Skeleton Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header Skeleton */}
                <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
                    <div className="w-full mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div>
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-9 w-24 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full mx-auto px-6 py-8 space-y-8">
                    {/* Upper Section Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Owner & Property Skeleton */}
                        <div className="lg:col-span-2 backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden min-h-[400px]">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Owner Section */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-24" />
                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Skeleton className="h-10 w-full rounded-xl" />
                                            <Skeleton className="h-10 w-full rounded-xl" />
                                        </div>
                                    </div>
                                    {/* Property Section */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-24" />
                                        <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-2xl">
                                            <Skeleton className="h-5 w-48 mb-3" />
                                            <div className="flex items-start gap-2 mb-4">
                                                <Skeleton className="h-4 w-4 mt-0.5" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-64" />
                                                    <Skeleton className="h-4 w-48" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <Skeleton className="h-16 w-full rounded-xl" />
                                                <Skeleton className="h-16 w-full rounded-xl" />
                                                <Skeleton className="h-16 w-full rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Payment Tracker Skeleton */}
                        <div className="backdrop-blur-sm flex bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden lg:col-span-2 min-h-[400px]">
                            <div className="flex flex-col w-full">
                                <div className="p-6 pb-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <Skeleton className="h-6 w-32" />
                                    </div>
                                </div>
                                <div className="px-6 pb-6 space-y-6">
                                    <div className="text-center">
                                        <Skeleton className="h-24 w-24 mx-auto rounded-full mb-4" />
                                    </div>
                                    <div className="space-y-3">
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col w-full">
                                <div className="p-6 pb-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <Skeleton className="h-6 w-32" />
                                    </div>
                                </div>
                                <div className="px-6 pb-6 space-y-6">
                                    <div className="text-center">
                                        <Skeleton className="h-24 w-24 mx-auto rounded-full mb-4" />
                                    </div>
                                    <div className="space-y-3">
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lower Section Skeleton */}
                    <div className="backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden">
                        <div className="p-6 pb-4">
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <div className="px-6 pb-6">
                            <div className="grid grid-cols-3 bg-gray-100 rounded-2xl p-1 mb-6">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-9 w-32 rounded-full" />
                                </div>
                                <div className="grid gap-6">
                                    {[...Array(2)].map((_, index) => (
                                        <div key={index} className="p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-9 w-9 rounded-full" />
                                                    <div>
                                                        <Skeleton className="h-5 w-32" />
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-4 w-24" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-6 w-20 rounded-full" />
                                                    <Skeleton className="h-6 w-16 rounded-full" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                <Skeleton className="h-20 w-full rounded-xl" />
                                                <Skeleton className="h-20 w-full rounded-xl" />
                                                <Skeleton className="h-20 w-full rounded-xl" />
                                                <Skeleton className="h-20 w-full rounded-xl" />
                                            </div>
                                            <Skeleton className="h-3 w-full rounded-full mb-2" />
                                            <Skeleton className="h-3 w-3/4 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Error Handling
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center p-6 bg-white/90 rounded-3xl shadow-lg">
                    <h2 className="text-xl font-semibold text-red-600">Error</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    const primarySale = renoSale.sales?.[0]
    const owner = primarySale?.order?.user
    const property = primarySale?.order?.property

    return (
        <RenoSaleContext.Provider value={renoSale}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header */}
                <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
                    <div className="w-full mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link
                                    to={LOCAL_PATH_PREFIX + "reno-sales"}
                                    className="rounded-full p-2 hover:bg-gray-100/80 transition-colors duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{renoSale.reno_sale_no}</h1>
                                    <p className="text-sm text-gray-600 mt-1">Reno Sale Details</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(renoSale.status)}`}>
                                    {renoSale.status?.charAt(0).toUpperCase() + renoSale.status?.slice(1)}
                                </span>
                                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full mx-auto px-6 py-8 space-y-8">
                    {/* Upper Section - Owner, Property, Sales Data, Payment Tracker */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Combined Owner & Property Information */}
                        <div className="lg:col-span-2 backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden min-h-[400px]">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-full">
                                        <Building className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold">Owner & Property Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Owner Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Property Owner</h3>

                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {owner?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{owner?.name}</p>
                                                <p className="text-sm text-gray-600">Property Owner</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                                                <Mail className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-700">{owner?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                                                <Phone className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-700">
                                                    +{owner?.country_code} {owner?.phone_no}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Property Details</h3>

                                        <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-2xl">
                                            <h4 className="font-semibold text-gray-900 mb-3">{property?.name}</h4>
                                            <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                                                <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                                                <div>
                                                    <p>{property?.address}</p>
                                                    <p>
                                                        {property?.city}, {property?.state} {property?.postcode}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="text-center p-3 bg-white/60 rounded-xl">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {primarySale?.order?.block}-{primarySale?.order?.floor}-{primarySale?.order?.unit_no}
                                                    </p>
                                                    <p className="text-xs text-gray-600">Unit</p>
                                                </div>
                                                <div className="text-center p-3 bg-white/60 rounded-xl">
                                                    <p className="text-lg font-bold text-gray-900">{primarySale?.order?.bedroom_count}</p>
                                                    <p className="text-xs text-gray-600">Bedrooms</p>
                                                </div>
                                                <div className="text-center p-3 bg-white/60 rounded-xl">
                                                    <p className="text-lg font-bold text-gray-900">{primarySale?.order?.bathroom_count}</p>
                                                    <p className="text-xs text-gray-600">Bathrooms</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Tracker */}
                        <div className="backdrop-blur-sm flex bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden lg:col-span-2 min-h-[400px]">
                            <PaymentSummaryPanel
                                title="Owner Payment Progress"
                                percentage={renoSale.sale_paid_percentage || 0}
                                paidAmount={renoSale.sale_paid_amount || 0}
                                totalAmount={renoSale.sale_total_amount || 0}
                            />
                            <PaymentSummaryPanel
                                title="Vendor Payment Progress"
                                percentage={renoSale.po_paid_percentage || 0}
                                paidAmount={renoSale.po_paid_amount || 0}
                                totalAmount={renoSale.po_total_amount || 0}
                            />
                        </div>
                    </div>

                    {/* Lower Section - Custom Tabs Implementation */}
                    <div className="backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden">
                        <div className="p-6 pb-4">
                            <h2 className="text-xl font-semibold">Sale Management</h2>
                        </div>
                        <div className="px-6 pb-6">
                            {/* Custom Tab Navigation */}
                            <div className="grid grid-cols-3 bg-gray-100 rounded-2xl p-1 mb-6">
                                <button
                                    onClick={() => setActiveTab("sales-orders")}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "sales-orders"
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Sales Orders & Invoices
                                </button>
                                <button
                                    onClick={() => setActiveTab("purchase-orders")}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "purchase-orders"
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Purchase Orders
                                </button>
                                <button
                                    onClick={() => setActiveTab("coming-soon")}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "coming-soon" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Coming Soon
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === "sales-orders" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Sales Orders ({renoSale.sales?.length || 0})</h3>
                                    </div>

                                    <div className="grid gap-6">
                                        {renoSale.sales?.map((sale) => {
                                            const invoiceTotals = calculateInvoiceTotals(sale.invoices)
                                            const isExpanded = expandedSales.includes(sale.id)

                                            return (
                                                <div
                                                    key={sale.id}
                                                    className="p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100/50 transition-all duration-300"
                                                >
                                                    {/* Sales Order Header */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-100 rounded-full">
                                                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{sale.sales_no}</h4>
                                                                <p className="text-sm text-gray-600">Created {formatDate(sale.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-sm font-medium border ${getSaleStatusColor(sale.status)}`}
                                                            >
                                                                {getSaleStatus(sale.status)}
                                                            </span>

                                                            {/* Action Buttons */}
                                                            <div className="flex justify-end gap-2">
                                                                <Link
                                                                    to={LOCAL_PATH_PREFIX + "sales/" + sale.id}
                                                                    state={{ fromUrl: location.pathname }}
                                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Comprehensive Financial Summary */}
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                        <div className="text-center p-4 bg-white/60 rounded-xl border border-blue-100/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <DollarSign className="h-4 w-4 text-gray-600" />
                                                                <span className="text-xs text-gray-600 font-medium">Total Amount</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-blue-50/60 rounded-xl border border-blue-200/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <Receipt className="h-4 w-4 text-blue-600" />
                                                                <span className="text-xs text-blue-600 font-medium">Issued Amount</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-blue-600">
                                                                {formatCurrency(sale.total_amount - sale.remaining_amount)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                                <span className="text-xs text-emerald-600 font-medium">Paid Amount</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-emerald-600">
                                                                {formatCurrency(sale.paid_percentage * sale.total_amount)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center p-4 bg-amber-50/60 rounded-xl border border-amber-200/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <Clock className="h-4 w-4 text-amber-600" />
                                                                <span className="text-xs text-amber-600 font-medium">Balance</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-amber-600">
                                                                {formatCurrency(sale.remaining_amount)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                                                            <div className="flex gap-2">
                                                                <span className="text-xs font-medium text-gray-600 p-2 rounded-md border border-blue-200 bg-blue-50">{100 - (sale.remaining_percentage * 100)}% Issued</span>
                                                                <span className="text-xs font-medium text-gray-600 p-2 rounded-md border border-emerald-200 bg-emerald-50">{sale.paid_percentage * 100}% Paid</span>
                                                            </div>
                                                        </div>
                                                        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className="absolute left-0 top-0 h-3 bg-blue-200"
                                                                style={{
                                                                    width: `${sale.total_amount > 0 ? (invoiceTotals.totalAmount / sale.total_amount) * 100 : 0}%`,
                                                                }}
                                                            ></div>
                                                            <div
                                                                className="absolute left-0 top-0 h-3 bg-emerald-300"
                                                                style={{
                                                                    width: `${sale.total_amount > 0 ? (invoiceTotals.paidAmount / sale.total_amount) * 100 : 0}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* Invoices Section */}
                                                    <div className="border-t border-blue-100/50 pt-4">
                                                        {sale.invoices && sale.invoices.length > 0 ? (
                                                            <>
                                                                <button
                                                                    onClick={() => toggleSaleExpansion(sale.id)}
                                                                    className="flex items-center justify-between w-full p-3 border border-gray-300 bg-white/60 hover:bg-white/90 rounded-xl transition-all duration-200"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Receipt className="h-5 w-5 text-blue-600" />
                                                                        <div className="text-left">
                                                                            <h5 className="font-semibold text-gray-900">Invoices ({sale.invoices.length})</h5>
                                                                            <p className="text-sm text-gray-600">
                                                                                {formatCurrency(invoiceTotals.paidAmount)} paid of{" "}
                                                                                {formatCurrency(invoiceTotals.totalAmount)} total
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="h-5 w-5 text-gray-500" />
                                                                    ) : (
                                                                        <ChevronRight className="h-5 w-5 text-gray-500" />
                                                                    )}
                                                                </button>

                                                                {/* Expanded Invoices - List View */}
                                                                {isExpanded && (
                                                                    <InvoiceListView
                                                                        item={sale}
                                                                        invoices={sale.invoices}
                                                                        onViewInvoice={(invoice) => handleViewInvoice(invoice, sale, 'sale')}
                                                                        onGenerate={() => handleGenerateInvoice(sale, 'sale')}
                                                                        showGenerateButton={true}
                                                                    />
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="text-center p-4 bg-white/60 rounded-xl border border-blue-100/30">
                                                                <p className="text-sm text-gray-600 mb-3">No invoices found for this sale.</p>
                                                                <button
                                                                    onClick={() => handleGenerateInvoice(sale, 'sale')}
                                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/60 hover:bg-white/80 border-2 border-dashed border-gray-300 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                    Generate First Invoice
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === "purchase-orders" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Purchase Orders</h3>
                                        <button
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-200 flex items-center gap-2"
                                            onClick={handleCreatePo}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create PO
                                        </button>
                                    </div>

                                    <div className="grid gap-4">
                                        {renoSale.purchase_orders?.map((po) => {

                                            const invoiceTotals = calculateInvoiceTotals(po.invoices)
                                            const isExpanded = expandedPurchaseOrders.includes(po.id)

                                            return (
                                                <div
                                                    key={po.id}
                                                    className="p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-2xl border border-purple-100/50"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-purple-100 rounded-full">
                                                                <Package className="h-5 w-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{po.po_no}</h4>
                                                                <p className="text-sm text-gray-600">Created {formatDate(po.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(po.payment_status)}`}
                                                            >
                                                                {po.payment_status}
                                                            </span>

                                                            {/* Action Buttons */}
                                                            <div className="flex justify-end gap-2">
                                                                <Link
                                                                    to={LOCAL_PATH_PREFIX + "purchase-orders/" + po.id}
                                                                    state={{ fromUrl: location.pathname }}
                                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Comprehensive Financial Summary */}
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                        <div className="text-center p-4 bg-white/60 rounded-xl border border-blue-100/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <DollarSign className="h-4 w-4 text-gray-600" />
                                                                <span className="text-xs text-gray-600 font-medium">Total Amount</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-gray-900">{formatCurrency(po.total_amount)}</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-blue-50/60 rounded-xl border border-blue-200/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <Receipt className="h-4 w-4 text-blue-600" />
                                                                <span className="text-xs text-blue-600 font-medium">Issued Amount</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-blue-600">
                                                                {formatCurrency(po.total_amount - po.remaining_amount)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                                <span className="text-xs text-emerald-600 font-medium">Paid Amount</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-emerald-600">
                                                                {formatCurrency(po.paid_percentage * po.total_amount)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center p-4 bg-amber-50/60 rounded-xl border border-amber-200/30">
                                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                                <Clock className="h-4 w-4 text-amber-600" />
                                                                <span className="text-xs text-amber-600 font-medium">Balance</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-amber-600">
                                                                {formatCurrency(po.remaining_amount)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="text-center p-3 bg-white/60 rounded-xl">
                                                        <p className="text-lg font-bold text-gray-900">{formatCurrency(po.total_amount)}</p>
                                                        <p className="text-xs text-gray-600">PO Amount</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-white/60 rounded-xl">
                                                        <p className="text-lg font-bold text-blue-600">{formatDate(po.shipping_date)}</p>
                                                        <p className="text-xs text-gray-600">Shipping Date</p>
                                                    </div>
                                                </div> */}

                                                    {/* Progress Bar */}
                                                    <div className="mb-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                                                            <div className="flex gap-2">
                                                                <span className="text-xs font-medium text-gray-600 p-2 rounded-md border border-blue-200 bg-blue-50">{100 - (po.remaining_percentage * 100)}% Issued</span>
                                                                <span className="text-xs font-medium text-gray-600 p-2 rounded-md border border-emerald-200 bg-emerald-50">{po.paid_percentage * 100}% Paid</span>
                                                            </div>
                                                        </div>
                                                        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className="absolute left-0 top-0 h-3 bg-blue-200"
                                                                style={{
                                                                    width: `${po.total_amount > 0 ? (invoiceTotals.totalAmount / po.total_amount) * 100 : 0}%`,
                                                                }}
                                                            ></div>
                                                            <div
                                                                className="absolute left-0 top-0 h-3 bg-emerald-300"
                                                                style={{
                                                                    width: `${po.total_amount > 0 ? (invoiceTotals.paidAmount / po.total_amount) * 100 : 0}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>


                                                    {/* Invoices Section */}
                                                    <div className="border-t border-blue-100/50 pt-4">
                                                        {po.invoices && po.invoices.length > 0 ? (
                                                            <>
                                                                <button
                                                                    onClick={() => togglePurchaseOrderExpansion(po.id)}
                                                                    className="flex items-center justify-between w-full p-3 border border-gray-300 bg-white/60 hover:bg-white/90 rounded-xl transition-all duration-200"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Receipt className="h-5 w-5 text-blue-600" />
                                                                        <div className="text-left">
                                                                            <h5 className="font-semibold text-gray-900">Invoices ({po.invoices.length})</h5>
                                                                            <p className="text-sm text-gray-600">
                                                                                {formatCurrency(invoiceTotals.paidAmount)} paid of{" "}
                                                                                {formatCurrency(invoiceTotals.totalAmount)} total
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="h-5 w-5 text-gray-500" />
                                                                    ) : (
                                                                        <ChevronRight className="h-5 w-5 text-gray-500" />
                                                                    )}
                                                                </button>

                                                                {/* Expanded Invoices - Reusable List View */}
                                                                {isExpanded && (
                                                                    <InvoiceListView
                                                                        item={po}
                                                                        invoices={po.invoices}
                                                                        onViewInvoice={(invoice) => handleViewInvoice(invoice, po, 'purchase_order')}
                                                                        onGenerate={() => handleGenerateInvoice(po, 'purchase_order')}
                                                                        showGenerateButton={true}
                                                                    />
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="text-center p-4 bg-white/60 rounded-xl border border-blue-100/30">
                                                                <p className="text-sm text-gray-600 mb-3">No invoices found for this purchase order.</p>
                                                                <button
                                                                    onClick={() => handleGenerateInvoice(po, 'purchase_order')}
                                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/60 hover:bg-white/80 border-2 border-dashed border-gray-300 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                    Generate First Invoice
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === "coming-soon" && (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                        <Clock className="h-10 w-10 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        We're working on exciting new features to enhance your renovation sale management experience.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                                            <h4 className="font-semibold text-gray-900 mb-2">Progress Tracking</h4>
                                            <p className="text-sm text-gray-600">
                                                Real-time renovation progress updates and milestone tracking
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl">
                                            <h4 className="font-semibold text-gray-900 mb-2">Document Management</h4>
                                            <p className="text-sm text-gray-600">Centralized document storage and version control</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                                            <h4 className="font-semibold text-gray-900 mb-2">Communication Hub</h4>
                                            <p className="text-sm text-gray-600">Integrated messaging and notification system</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                                            <h4 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
                                            <p className="text-sm text-gray-600">Advanced reporting and business intelligence</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    itemId={selectedItem?.id || ''}
                    itemType={selectedItemType}
                    totalAmount={selectedItemTotalAmount || 0}
                    isOpen={isInvoiceModalOpen}
                    onClose={handleCloseInvoiceModal}
                    onMarkAsPaid={handleMarkAsPaid}
                    onDelete={handleDeleteInvoice}
                />

                <CreatePOModal
                    sales={renoSale.sales}
                    isOpen={isCreatePoModalOpen}
                    onCreate={handleNewPo}
                    onClose={() => setIsCreatePoModalOpen(false)}
                />

                <GenerateInvoiceModal
                    item={selectedItem}
                    itemType={selectedItemType}
                    isOpen={isGenerateInvoiceModalOpen}
                    onClose={handleCloseGenerateInvoiceModal}
                    onGenerate={handleInvoiceGenerated}
                />
            </div>
        </RenoSaleContext.Provider>
    )
}
