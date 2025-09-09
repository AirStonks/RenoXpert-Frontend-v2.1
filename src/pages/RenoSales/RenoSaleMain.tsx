"use client"

import React, { useState, useEffect, useRef } from "react"
import {
    Eye,
    Clock,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    DollarSign,
    Building,
    ShoppingCart,
    Edit,
    Trash2,
    User,
} from "lucide-react"
import { RenoSaleStatus, RenoXSale } from "../../types"
import { renoSalesIndex } from "../../services/api"
import { useNavigate } from "react-router-dom"

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

type SortOrder = "asc" | "desc"
type SortField = "reno_sale_no" | "status" | "created_at"

interface StatusConfig {
    label: string;
    color: string;
    textColor: string;
}

const statusConfig: Record<RenoSaleStatus, StatusConfig> = {
    pending: { label: "Pending", color: "bg-yellow-50 border-yellow-300", textColor: "text-yellow-600" },
    approved: { label: "Approved", color: "bg-blue-50 border-blue-300", textColor: "text-blue-600" },
    active: { label: "Active", color: "bg-green-50 border-green-300", textColor: "text-green-600" },
    cancelled: { label: "Cancelled", color: "bg-red-50 border-red-300", textColor: "text-red-600" },
};


export default function RenoSalesMain() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();
    const [renoSales, setRenoSales] = useState<RenoXSale[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [page, setPage] = useState<number>(1)
    const [size, setSize] = useState<number>(10)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [sortField, setSortField] = useState<SortField>("reno_sale_no")
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
    const [expandedRows, setExpandedRows] = useState<string[]>([])

    useEffect(() => {
        document.title = "Reno Sales Overview | RenoXpert"
        fetchRenoSales(1, 10, '', 'desc', 'reno_sale_no')
    }, [])

    const fetchRenoSales = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string,
        // status?: FilterTerms
    ) => {
        try {
            setIsLoading(true)

            const response = await renoSalesIndex(size, page, searchTerm, order, field);
            const data: RenoXSale[] = response?.data || [];

            setRenoSales(data)
            setTotalItems(response?.totalCount || 0)
            setIsLoading(false)

        } catch (error) {
            console.error("Error fetching reno sales:", error)
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("en-MY", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    const toggleRowExpansion = (id: string) => {
        setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(e.target.value)
        // Implement search logic here

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            fetchRenoSales(1, size, value, sortOrder, sortField);
        }, 500);
    }


    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        fetchRenoSales(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        fetchRenoSales(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleViewDetails = (id: string) => {
        navigate(LOCAL_PATH_PREFIX + `reno-sales/${id}`);
    }

    const totalPages = Math.ceil(totalItems / size);

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
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </td>
        </tr>
    )

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Reno Sales Overview</h1>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            placeholder="Search by Owner/Unit"
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500">
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Sales</p>
                            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                RM {renoSales.reduce((sum, sale) => sum + sale.payment.total_amount, 0).toLocaleString("en-MY")}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Approved</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {renoSales.filter((sale) => sale.status === "approved").length}
                            </p>
                        </div>
                        <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {renoSales.filter((sale) => sale.status === "completed").length}
                            </p>
                        </div>
                        <Building className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
            </div> */}

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-6 py-4 font-semibold">Reno Sale No.</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Unit</th>
                            <th className="px-6 py-4 font-semibold">Owner</th>
                            <th className="px-6 py-4 font-semibold">Sale Orders</th>
                            <th className="px-6 py-4 font-semibold">PO</th>
                            <th className="px-6 py-4 font-semibold">Sales Order Payment Status</th>
                            <th className="px-6 py-4 font-semibold">PO Payment Status</th>
                            <th className="px-6 py-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading
                            ? Array.from({ length: size }).map((_, index) => <SkeletonRow key={index} />)
                            : renoSales.map((renoSale) => (
                                <React.Fragment key={renoSale.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleRowExpansion(renoSale.id)}
                                                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                                            >
                                                {expandedRows.includes(renoSale.id) ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{renoSale.reno_sale_no}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[renoSale.status].color} ${statusConfig[renoSale.status].textColor}`}
                                            >
                                                {statusConfig[renoSale.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                                    <Building className="h-4 w-4" />
                                                    {renoSale.sales[0].order.property.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {renoSale.sales[0].order.block}-{renoSale.sales[0].order.floor}-{renoSale.sales[0].order.unit_no}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    {renoSale.sales[0].order.user.name}
                                                </p>
                                                <p className="text-sm text-gray-600">+{renoSale.sales[0].order.user.country_code} {renoSale.sales[0].order.user.phone_no}</p>
                                                <p className="text-sm text-gray-600">{renoSale.sales[0].order.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {renoSale.sales.slice(0, 2).map((sale) => (
                                                    <div key={sale.id} className="flex items-center gap-1">
                                                        <ShoppingCart className="h-3 w-3 text-blue-500" />
                                                        <p className="font-mono text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline">
                                                            {sale.sales_no}
                                                        </p>
                                                    </div>
                                                ))}
                                                {renoSale.sales.length > 2 && (
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        +{renoSale.sales.length - 2} more orders
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Total: {renoSale.sales.length} order{renoSale.sales.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {renoSale.purchase_orders.slice(0, 2).map((po) => (
                                                    <div key={po.id} className="flex items-center gap-1">
                                                        <ShoppingCart className="h-3 w-3 text-blue-500" />
                                                        <p className="font-mono text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline">
                                                            {po.po_no}
                                                        </p>
                                                    </div>
                                                ))}
                                                {renoSale.purchase_orders.length > 2 && (
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        +{renoSale.purchase_orders.length - 2} more orders
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Total: {renoSale.purchase_orders.length} order{renoSale.purchase_orders.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-3">
                                                {/* Payment Amount Display */}
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 transition-colors duration-200">
                                                        RM {formatCurrency(renoSale.sale_paid_amount)}
                                                    </span>
                                                    <span className="text-gray-400 font-medium">/</span>
                                                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 transition-colors duration-200">
                                                        RM {formatCurrency(renoSale.sale_total_amount)}
                                                    </span>
                                                </div>
                                                {/* Percentage Badge */}
                                                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 w-fit transition-colors duration-200">
                                                    {(renoSale.sale_paid_percentage * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-3">
                                                {/* Payment Amount Display */}
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 transition-colors duration-200">
                                                        RM {formatCurrency(renoSale.po_paid_amount)}
                                                    </span>
                                                    <span className="text-gray-400 font-medium">/</span>
                                                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 transition-colors duration-200">
                                                        RM {formatCurrency(renoSale.po_total_amount)}
                                                    </span>
                                                </div>
                                                {/* Percentage Badge */}
                                                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 w-fit transition-colors duration-200">
                                                    {(renoSale.po_paid_percentage * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(renoSale.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows.includes(renoSale.id) && (
                                        <tr className="border-b">
                                            <td colSpan={10} className="px-6 py-4">
                                                <div className="bg-gray-50 rounded-lg p-6 transition-all duration-300 ease-in-out">
                                                    <h3 className="text-base font-semibold text-gray-800 mb-4">Reno Sale Details</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Sale Information
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Reno Sale Number</p>
                                                                <p className="text-gray-600">{renoSale.reno_sale_no}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Status</p>
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[renoSale.status].color} ${statusConfig[renoSale.status].textColor}`}
                                                                >
                                                                    {statusConfig[renoSale.status].label}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Payment Status</p>
                                                                <div className="mt-2 space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                                            Paid: RM {formatCurrency(renoSale.sale_paid_amount)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700">
                                                                            Total: RM {formatCurrency(renoSale.sale_total_amount)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                                                                        {(renoSale.sale_paid_percentage * 100).toFixed(1)}% Completed
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Unit & Owner Details
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Property</p>
                                                                <p className="text-gray-600">{renoSale.sales[0].order.property.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Unit Details</p>
                                                                <p className="text-gray-600">
                                                                    {renoSale.sales[0].order.block}-{renoSale.sales[0].order.floor}-{renoSale.sales[0].order.unit_no}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Owner</p>
                                                                <p className="text-gray-600">{renoSale.sales[0].order.user.name}</p>
                                                                <p className="text-gray-500 text-xs">{renoSale.sales[0].order.user.email}</p>
                                                                {renoSale.sales[0].order.user.phone_no && <p className="text-gray-500 text-xs">+{renoSale.sales[0].order.user.country_code} {renoSale.sales[0].order.user.phone_no}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Associated Sale Orders ({renoSale.sales.length})
                                                            </h4>
                                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                                {renoSale.sales.map((sale) => (
                                                                    <div key={sale.id} className="bg-white p-3 rounded border">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <ShoppingCart className="h-4 w-4 text-blue-500" />
                                                                            <p className="font-mono text-blue-600 text-sm font-medium">{sale.sales_no}</p>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mb-1">{formatDate(sale.created_at)}</p>
                                                                        <p className="text-sm font-semibold text-green-600">
                                                                            RM {formatCurrency(sale.total_amount)}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="bg-blue-50 p-2 rounded">
                                                                <p className="text-sm font-medium text-blue-800">
                                                                    Total SO Amount: RM{" "}
                                                                    {formatCurrency(renoSale.sales.reduce((sum, sale) => sum + sale.total_amount, 0))}
                                                                </p>
                                                            </div>
                                                            <div className="pt-2 border-t border-gray-200">
                                                                <p className="text-xs text-gray-500">Created: {formatDate(renoSale.created_at)}</p>
                                                                <p className="text-xs text-gray-500">Updated: {formatDate(renoSale.updated_at)}</p>
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
            {!isLoading && renoSales.length > 0 && (
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
                                        className={`px-3 py-1 border rounded-lg ${page === currentPage
                                            ? 'bg-blue-500 text-white'
                                            : 'hover:bg-gray-100'
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
            )}
        </div>
    )
}
