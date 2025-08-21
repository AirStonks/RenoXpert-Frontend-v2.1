"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Eye, Clock, ChevronDown, ChevronUp, Package, DollarSign, User, Building, Calendar, Truck, PlusIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { poIndex } from "../../services/api"
import { Order, PurchaseOrder } from "../../types"

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

// Extended interface for display purposes (since API might not have all display fields)
interface DisplayPurchaseOrder extends PurchaseOrder {
    property?: {
        name?: string
        block?: string
        unit_no?: string
    }
    sale?: {
        sales_no?: string;
        status?: string;
        total_amount?: number;
        order?: Order;
    };
}

type SortOrder = "asc" | "desc"
type SortField = "po_no" | "total_amount" | "order_status" | "created_at"

const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-500", textColor: "text-white" },
    approved: { label: "Approved", color: "bg-blue-500", textColor: "text-white" },
    shipped: { label: "Shipped", color: "bg-purple-500", textColor: "text-white" },
    delivered: { label: "Delivered", color: "bg-green-500", textColor: "text-white" },
    cancelled: { label: "Cancelled", color: "bg-red-500", textColor: "text-white" },
}



export default function POMain() {
    const location = useLocation()
    const [purchaseOrders, setPurchaseOrders] = useState<DisplayPurchaseOrder[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [page, setPage] = useState<number>(1)
    const [size, setSize] = useState<number>(10)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [sortField] = useState<SortField>("po_no")
    const [sortOrder] = useState<SortOrder>("desc")
    const [expandedRows, setExpandedRows] = useState<string[]>([])

    const fetchPurchaseOrders = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await poIndex(size, page, searchTerm, sortOrder, sortField, true)
            const data = response?.data || []
            setPurchaseOrders(data)
            setTotalItems(response?.totalCount || 0)
        } catch (error) {
            console.error("Error fetching purchase orders:", error)
        } finally {
            setIsLoading(false)
        }
    }, [size, page, searchTerm, sortOrder, sortField])

    useEffect(() => {
        document.title = "Purchase Orders Overview | RenoXpert"
        fetchPurchaseOrders()
    }, [fetchPurchaseOrders])

    // Refetch data when pagination or search parameters change (handled by fetchPurchaseOrders dependencies)

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        // Note: fetchPurchaseOrders will be called by useEffect when page changes
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        // Note: fetchPurchaseOrders will be called by useEffect when size changes
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", {
            style: "currency",
            currency: "MYR",
        }).format(amount)
    }

    const toggleRowExpansion = (id: string | number) => {
        const idStr = String(id)
        setExpandedRows((prev) => (prev.includes(idStr) ? prev.filter((rowId) => rowId !== idStr) : [...prev, idStr]))
    }



    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setPage(1) // Reset to first page when searching
    }

    const SkeletonRow = () => (
        <tr className="border-b">
            <td className="px-4 py-3">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            </td>
        </tr>
    )


    const totalPages = Math.ceil(totalItems / size);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Purchase Orders Overview</h1>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            placeholder="Search purchase orders..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            disabled
                            className="flex items-center gap-2 px-4 py-2 bg-blue-300 text-white rounded-lg cursor-not-allowed relative"
                            onMouseOver={e => {
                                const tooltip = document.createElement('div');
                                tooltip.textContent = "Coming Soon";
                                tooltip.className = "absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow z-20";
                                tooltip.style.whiteSpace = "nowrap";
                                tooltip.setAttribute('id', 'coming-soon-tooltip');
                                e.currentTarget.appendChild(tooltip);
                            }}
                            onMouseOut={e => {
                                const tooltip = e.currentTarget.querySelector('#coming-soon-tooltip');
                                if (tooltip) e.currentTarget.removeChild(tooltip);
                            }}
                        >
                            <PlusIcon className="h-5 w-5" />
                            Create New PO
                        </button>
                        {/* <Link
                            to={LOCAL_PATH_PREFIX + 'orders/create'}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Create
                        </Link> */}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                        </div>
                        <Package className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Value</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(
                                    purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0)
                                )}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {purchaseOrders.filter((po) => po.order_status === "pending").length}
                            </p>
                        </div>
                        <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Delivered</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {purchaseOrders.filter((po) => po.order_status === "delivered").length}
                            </p>
                        </div>
                        <Building className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-6 py-4 font-semibold">PO Number</th>
                            <th className="px-6 py-4 font-semibold">Unit</th>
                            <th className="px-6 py-4 font-semibold">Owner</th>
                            <th className="px-6 py-4 font-semibold">Total Amount</th>
                            <th className="px-6 py-4 font-semibold">Order Status</th>
                            <th className="px-6 py-4 font-semibold">Associated Sales Order</th>
                            <th className="px-6 py-4 font-semibold">Sales Date</th>
                            <th className="px-6 py-4 font-semibold">Vendor</th>
                            <th className="px-6 py-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading
                            ? Array.from({ length: size }).map((_, index) => <SkeletonRow key={index} />)
                            : purchaseOrders.map((po) => (
                                <React.Fragment key={po.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleRowExpansion(po.id || '')}
                                                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                                            >
                                                {expandedRows.includes(String(po.id || '')) ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{po.po_no || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">ID: {po.id || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="font-medium text-gray-900">{po.sale?.order?.property?.name ?? 'N/A'}</p>
                                                <p className="text-sm text-gray-600">
                                                    {po.sale?.order ? `${po.sale?.order?.block}-${po.sale?.order?.floor}-${po.sale?.order?.unit_no}` : ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    {po.sale?.order?.user?.name ?? 'N/A'}
                                                </p>
                                                <p className="text-sm text-gray-600">{po.sale?.order?.user?.email ?? ''}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-lg text-green-600">
                                                {po.total_amount ? formatCurrency(po.total_amount) : 'N/A'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm font-medium ${po.order_status && statusConfig[po.order_status as keyof typeof statusConfig]
                                                    ? `${statusConfig[po.order_status as keyof typeof statusConfig].color} ${statusConfig[po.order_status as keyof typeof statusConfig].textColor}`
                                                    : 'bg-gray-500 text-white'
                                                    }`}
                                            >
                                                {po.order_status && statusConfig[po.order_status as keyof typeof statusConfig]
                                                    ? statusConfig[po.order_status as keyof typeof statusConfig].label
                                                    : po.order_status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {po.sale?.sales_no ? (
                                                    <p className="font-mono text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline">
                                                        {po.sale.sales_no}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-500">No sales</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {po.sale?.sales_no ? (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {po.sale?.order?.created_at ? formatDateShort(po.sale.order.created_at) : 'N/A'}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">N/A</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                                    <Truck className="h-4 w-4" />
                                                    {po.vendor?.name || 'N/A'}
                                                </p>
                                                <p className="text-sm text-gray-600">{po.vendor?.email || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                // Add State
                                                to={`${LOCAL_PATH_PREFIX}purchase-orders/${po.id}`}
                                                state={{ fromUrl: location.pathname }}
                                                className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                    {expandedRows.includes(String(po.id || '')) && (
                                        <tr className="border-b">
                                            <td colSpan={10} className="px-6 py-4">
                                                <div className="bg-gray-50 rounded-lg p-6 transition-all duration-300 ease-in-out">
                                                    <h3 className="text-base font-semibold text-gray-800 mb-4">Purchase Order Details</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Order Information
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">PO Number</p>
                                                                <p className="text-gray-600">{po.po_no || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Total Amount</p>
                                                                <p className="text-gray-600 font-semibold">
                                                                    {po.total_amount ? formatCurrency(po.total_amount) : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Status</p>
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${po.order_status && statusConfig[po.order_status as keyof typeof statusConfig]
                                                                        ? `${statusConfig[po.order_status as keyof typeof statusConfig].color} ${statusConfig[po.order_status as keyof typeof statusConfig].textColor}`
                                                                        : 'bg-gray-500 text-white'
                                                                        }`}
                                                                >
                                                                    {po.order_status && statusConfig[po.order_status as keyof typeof statusConfig]
                                                                        ? statusConfig[po.order_status as keyof typeof statusConfig].label
                                                                        : po.order_status || 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Property Details
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Property Name</p>
                                                                <p className="text-gray-600">{po.property?.name || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Block & Unit</p>
                                                                <p className="text-gray-600">
                                                                    {po.property?.block && po.property?.unit_no
                                                                        ? `Block ${po.property.block}, Unit ${po.property.unit_no}`
                                                                        : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Owner</p>
                                                                <p className="text-gray-600">{po.sale?.order?.user?.name || 'N/A'}</p>
                                                                <p className="text-gray-500 text-xs">{po.sale?.order?.user?.email || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Associated Sales Order
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {po.sale?.sales_no ? (
                                                                    <div className="bg-white p-2 rounded border">
                                                                        <p className="font-mono text-blue-600 text-sm">{po.sale.sales_no}</p>
                                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {po.sale?.order?.created_at ? formatDate(po.sale.order.created_at) : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-500">No associated sales</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Vendor & Timeline
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Vendor</p>
                                                                <p className="text-gray-600">{po.vendor?.name || 'N/A'}</p>
                                                                <p className="text-gray-500 text-xs">{po.vendor?.email || 'N/A'}</p>
                                                                {po.vendor?.phone_no && <p className="text-gray-500 text-xs">{po.vendor.phone_no}</p>}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Created</p>
                                                                <p className="text-gray-600">{po.created_at ? formatDate(po.created_at) : 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Last Updated</p>
                                                                <p className="text-gray-600">{po.updated_at ? formatDate(po.updated_at) : 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {
                !isLoading && purchaseOrders.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-md">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <span>Show</span>
                            <select
                                value={size}
                                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                                className="border rounded-lg px-3 py-1"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="50">50</option>
                            </select>
                            <span>per page</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>
                                {(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => handlePageChange(page - 1)}
                                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                    const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
                                    const currentPage = startPage + index;
                                    return (
                                        <button
                                            key={currentPage}
                                            onClick={() => handlePageChange(currentPage)}
                                            className={`px-3 py-1 border rounded-lg ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            {currentPage}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => handlePageChange(page + 1)}
                                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
