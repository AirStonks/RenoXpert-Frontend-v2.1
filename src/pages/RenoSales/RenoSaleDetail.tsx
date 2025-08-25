"use client"

import { useEffect, useState } from "react"
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Building,
    ShoppingCart,
    Package,
    Clock,
    TrendingUp,
    Download,
    Eye,
    Plus,
    Receipt,
    Calendar,
    ChevronDown,
    ChevronRight,
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
            <div className=" rounded-2xl border-2 border-blue-100/60 overflow-hidden shadow-lg">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500/8 to-sky-500/8 border-b border-blue-200/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl">
                            <Receipt className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">Invoice Details</h4>
                            <p className="text-sm text-gray-600">Manage and track all invoices</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        <div>Invoice Details</div>
                        <div>Due Date</div>
                        <div>Amount</div>
                        <div>Status</div>
                        <div className="text-right">Actions</div>
                    </div>
                </div>
                
                {/* Invoice Rows */}
                <div className="divide-y divide-blue-100/50">
                    {invoices.map((invoice, index) => (
                        <div key={invoice.id} className="px-6 py-4 hover:bg-white/70 transition-all duration-200 group">
                            <div className="grid grid-cols-5 gap-4 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-400 to-sky-500 rounded-xl shadow-sm">
                                        <Receipt className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h6 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{invoice.invoice_no}</h6>
                                        <p className="text-xs text-gray-600">Invoice #{index + 1}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <div className="p-1 bg-blue-100 rounded-lg">
                                            <Calendar className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <span className="font-medium">{format(invoice.due_date)}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">Due Date</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{currency(invoice.amount || 0)}</p>
                                    <p className="text-xs text-gray-600">Amount</p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 ${statusClass(invoice.status)} shadow-sm`}>
                                        {invoice.status}
                                    </span>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-all duration-200 flex items-center gap-1.5 opacity-50 cursor-not-allowed shadow-sm">
                                        <Download className="h-3 w-3" />
                                        PDF
                                    </button>
                                    <button
                                        onClick={() => onViewInvoice(invoice, item)}
                                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-sm group-hover:shadow-md"
                                    >
                                        <Eye className="h-3 w-3" />
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Generate Button */}
                {showGenerateButton && (
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-sky-50/50 border-t border-blue-200/50">
                        <button 
                            onClick={onGenerate} 
                            className="w-full px-4 py-3 text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 border-2 border-dashed border-blue-300 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
                        >
                            <div className="p-1 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                                <Plus className="h-4 w-4 text-white" />
                            </div>
                            {generateLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// Reusable: Sales Orders Table
const SalesOrdersTable = ({
    sales,
    onViewSale,
    onGenerateInvoice,
    onViewInvoice,
    expandedSales,
    onToggleExpansion,
}: {
    sales: Sale[]
    onViewSale: (sale: Sale) => void
    onGenerateInvoice: (sale: Sale) => void
    onViewInvoice: (invoice: Invoice, sale: Sale) => void
    expandedSales: string[]
    onToggleExpansion: (saleId: string) => void
}) => {
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

    return (
        <div className="bg-white/70 rounded-xl border border-white/80 overflow-hidden">
            <div className="px-6 py-3 bg-white/50 border-b border-gray-200/50">
                <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div>Sales Order</div>
                    <div>Created Date</div>
                    <div>Total Amount</div>
                    <div>Paid Amount</div>
                    <div>Remaining</div>
                    <div>Status</div>
                    <div className="text-right">Actions</div>
                </div>
            </div>
            <div className="divide-y divide-gray-200/50">
                {sales.map((sale) => {
                    const isExpanded = expandedSales.includes(sale.id)
                    
                    return (
                        <div key={sale.id}>
                            <div className="px-6 py-4 hover:bg-white/50 transition-colors duration-200">
                                <div className="grid grid-cols-7 gap-4 items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <h6 className="font-semibold text-gray-900 text-sm">{sale.sales_no}</h6>
                                            <p className="text-xs text-gray-600">Sales Order</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                            <Calendar className="h-3 w-3 text-gray-500" />
                                            <span>{formatDate(sale.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">Created Date</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                                        <p className="text-xs text-gray-600">Total Amount</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(sale.paid_percentage * sale.total_amount)}</p>
                                        <p className="text-xs text-gray-600">Paid Amount</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-amber-600">{formatCurrency(sale.remaining_amount)}</p>
                                        <p className="text-xs text-gray-600">Remaining</p>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSaleStatusColor(sale.status)}`}>
                                            {getSaleStatus(sale.status)}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => onViewSale(sale)}
                                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white/60 hover:bg-white/80 border border-gray-200 rounded-full transition-colors duration-200 flex items-center gap-1"
                                        >
                                            <Eye className="h-3 w-3" />
                                            View
                                        </button>
                                         {sale.invoices && sale.invoices.length > 0 && (
                                             <button
                                                 onClick={() => onToggleExpansion(sale.id)}
                                                 className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full transition-all duration-300 flex items-center gap-1.5 hover:shadow-md transform hover:scale-105"
                                             >
                                                 {isExpanded ? (
                                                     <ChevronDown className="h-3 w-3 transition-transform duration-300" />
                                                 ) : (
                                                     <ChevronRight className="h-3 w-3 transition-transform duration-300" />
                                                 )}
                                                 Invoices
                                             </button>
                                         )}
                                        <button
                                            onClick={() => onGenerateInvoice(sale)}
                                            className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors duration-200 flex items-center gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expanded Invoices Section */}
                            {isExpanded && sale.invoices && sale.invoices.length > 0 && (
                                <div className="px-6 pb-4 bg-blue-50/20 animate-in slide-in-from-top-2 duration-300 ease-out">
                                    <InvoiceListView
                                        item={sale}
                                        invoices={sale.invoices}
                                        onViewInvoice={(invoice) => onViewInvoice(invoice, sale)}
                                        onGenerate={() => onGenerateInvoice(sale)}
                                        showGenerateButton={true}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Reusable: Purchase Orders Table
const PurchaseOrdersTable = ({
    purchaseOrders,
    onViewPO,
    onGenerateInvoice,
    onViewInvoice,
    expandedPurchaseOrders,
    onToggleExpansion,
}: {
    purchaseOrders: PurchaseOrder[]
    onViewPO: (po: PurchaseOrder) => void
    onGenerateInvoice: (po: PurchaseOrder) => void
    onViewInvoice: (invoice: Invoice, po: PurchaseOrder) => void
    expandedPurchaseOrders: string[]
    onToggleExpansion: (poId: string) => void
}) => {
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

    return (
        <div className="bg-white/70 rounded-xl border border-white/80 overflow-hidden">
            <div className="px-6 py-3 bg-white/50 border-b border-gray-200/50">
                <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div>Purchase Order</div>
                    <div>Created Date</div>
                    <div>Total Amount</div>
                    <div>Paid Amount</div>
                    <div>Remaining</div>
                    <div>Status</div>
                    <div className="text-right">Actions</div>
                </div>
            </div>
            <div className="divide-y divide-gray-200/50">
                {purchaseOrders.map((po) => {
                    const isExpanded = expandedPurchaseOrders.includes(po.id)
                    
                    return (
                        <div key={po.id}>
                            <div className="px-6 py-4 hover:bg-white/50 transition-colors duration-200">
                                <div className="grid grid-cols-7 gap-4 items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Package className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <h6 className="font-semibold text-gray-900 text-sm">{po.po_no}</h6>
                                            <p className="text-xs text-gray-600">Purchase Order</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                            <Calendar className="h-3 w-3 text-gray-500" />
                                            <span>{formatDate(po.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">Created Date</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{formatCurrency(po.total_amount)}</p>
                                        <p className="text-xs text-gray-600">Total Amount</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(po.paid_percentage * po.total_amount)}</p>
                                        <p className="text-xs text-gray-600">Paid Amount</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-amber-600">{formatCurrency(po.remaining_amount)}</p>
                                        <p className="text-xs text-gray-600">Remaining</p>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(po.payment_status)}`}>
                                            {po.payment_status}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => onViewPO(po)}
                                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white/60 hover:bg-white/80 border border-gray-200 rounded-full transition-colors duration-200 flex items-center gap-1"
                                        >
                                            <Eye className="h-3 w-3" />
                                            View
                                        </button>
                                        {po.invoices && po.invoices.length > 0 && (
                                            <button
                                                onClick={() => onToggleExpansion(po.id)}
                                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full transition-all duration-300 flex items-center gap-1.5 hover:shadow-md transform hover:scale-105"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-3 w-3 transition-transform duration-300" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3 transition-transform duration-300" />
                                                )}
                                                Invoices
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onGenerateInvoice(po)}
                                            className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors duration-200 flex items-center gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expanded Invoices Section */}
                            {isExpanded && po.invoices && po.invoices.length > 0 && (
                                <div className="px-6 pb-4 bg-blue-50/20 animate-in slide-in-from-top-2 duration-300 ease-out">
                                    <InvoiceListView
                                        item={po}
                                        invoices={po.invoices}
                                        onViewInvoice={(invoice) => onViewInvoice(invoice, po)}
                                        onGenerate={() => onGenerateInvoice(po)}
                                        showGenerateButton={true}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
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

    const toggleSaleExpansion = (saleId: string) => {
        setExpandedSales((prev) => (prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]))
    }

    const togglePurchaseOrderExpansion = (purchaseOrderId: string) => {
        setExpandedPurchaseOrders((prev) => (prev.includes(purchaseOrderId) ? prev.filter((id) => id !== purchaseOrderId) : [...prev, purchaseOrderId]))
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

                                    {renoSale.sales && renoSale.sales.length > 0 ? (
                                        <SalesOrdersTable
                                            sales={renoSale.sales}
                                            onViewSale={(sale) => {
                                                navigate(LOCAL_PATH_PREFIX + "sales/" + sale.id, { state: { fromUrl: location.pathname } })
                                            }}
                                            onGenerateInvoice={(sale) => handleGenerateInvoice(sale, 'sale')}
                                            onViewInvoice={(invoice, sale) => handleViewInvoice(invoice, sale, 'sale')}
                                            expandedSales={expandedSales}
                                            onToggleExpansion={toggleSaleExpansion}
                                        />
                                    ) : (
                                        <div className="text-center py-12 bg-white/70 rounded-xl border border-white/80">
                                            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                                <ShoppingCart className="h-10 w-10 text-blue-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sales Orders</h3>
                                            <p className="text-gray-600 mb-6">No sales orders have been created for this renovation sale yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "purchase-orders" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Purchase Orders ({renoSale.purchase_orders?.length || 0})</h3>
                                        <button
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-200 flex items-center gap-2"
                                            onClick={handleCreatePo}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create PO
                                        </button>
                                    </div>

                                    {renoSale.purchase_orders && renoSale.purchase_orders.length > 0 ? (
                                        <PurchaseOrdersTable
                                            purchaseOrders={renoSale.purchase_orders}
                                            onViewPO={(po) => {
                                                navigate(LOCAL_PATH_PREFIX + "purchase-orders/" + po.id, { state: { fromUrl: location.pathname } })
                                            }}
                                            onGenerateInvoice={(po) => handleGenerateInvoice(po, 'purchase_order')}
                                            onViewInvoice={(invoice, po) => handleViewInvoice(invoice, po, 'purchase_order')}
                                            expandedPurchaseOrders={expandedPurchaseOrders}
                                            onToggleExpansion={togglePurchaseOrderExpansion}
                                        />
                                    ) : (
                                        <div className="text-center py-12 bg-white/70 rounded-xl border border-white/80">
                                            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                                <Package className="h-10 w-10 text-purple-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchase Orders</h3>
                                            <p className="text-gray-600 mb-6">No purchase orders have been created for this renovation sale yet.</p>
                                            <button
                                                onClick={handleCreatePo}
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-200 flex items-center gap-2 mx-auto"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create First PO
                                            </button>
                                        </div>
                                    )}
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
