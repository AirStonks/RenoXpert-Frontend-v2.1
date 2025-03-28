import React, { useEffect, useRef, useState } from 'react';
import Loading from '../../components/Loading';
import { salesIndex } from '../../services/api';
import { Invoice, Sale } from '../../types';
import { Link } from 'react-router-dom';

type SortOrder = 'asc' | 'desc' | null;

interface FilterOption {
    column: string;
    value: string;
    label?: string;
}

const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
};

function SalesOrderPO() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [sales, setSales] = useState<Sale[]>([]);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<FilterOption[]>([]);
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    useEffect(() => {
        document.title = "Sales | RenoXpert";
        initSalesTable(1, 10, '', null, '');
    }, []);

    const initSalesTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string,
        filters: FilterOption[] = []
    ) => {
        try {
            setIsLoading(true);
            const filterParams = filters.reduce((acc, curr) => {
                acc[curr.column] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            const response = await salesIndex(size, page, searchTerm, order, field, filterParams);
            const newSales = response?.data || [];
            setSales(newSales);
            setTotalItems(response?.totalCount || 0);
            setExpandedCards(newSales.reduce((acc, sale) => ({
                ...acc,
                [sale.id]: true
            }), {}));
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initSalesTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            try {
                setIsLoading(true);
                const response = await salesIndex(size, 1, value, sortOrder, sortField);
                const newSales = response?.data || [];
                setSales(newSales);
                setTotalItems(response?.totalCount || 0);
                setExpandedCards(newSales.reduce((acc, sale) => ({
                    ...acc,
                    [sale.id]: true
                }), {}));
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initSalesTable(newPage, size, searchTerm, sortOrder, sortField, filter);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        initSalesTable(1, newSize, searchTerm, sortOrder, sortField, filter);
    };

    const toggleCard = (saleId: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [saleId]: !prev[saleId]
        }));
    };

    const totalPages = Math.ceil(totalItems / size);

    const renderSaleCard = (sale: Sale, index: number) => {
        const isExpanded = expandedCards[sale.id] ?? true;
        const isOdd = index % 2 === 1;

        return (
            <div className="card mb-4 shadow-sm" key={sale.id}>
                <div
                    className={`card-header flex justify-between items-center cursor-pointer p-4 ${isOdd ? 'bg-gray-100' : 'bg-white'}`}
                    onClick={() => toggleCard(sale.id)}
                >
                    <div className="card-title flex items-center gap-2">
                        <Link
                            to={'/sales/' + sale.id}
                            state={{ fromUrl: '/finance/sales-order-po' }}
                            className="text-orange-500 font-semibold hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            #{sale.sales_no}
                        </Link>
                        <span className="text-gray-700">
                            - RM {sale.order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <button className="btn btn-sm btn-icon text-gray-500 hover:text-gray-700">
                        <i className={`ki-outline ${isExpanded ? 'ki-up' : 'ki-down'} text-lg`}></i>
                    </button>
                </div>
                {isExpanded && (
                    <div className="card-body p-4">
                        {/* Sale Details Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sale Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600 font-medium">Date (Owner Approved):</span>
                                    <p className="text-sm text-gray-700">
                                        {sale.order.confirmed_at ? formatDate(sale.order.confirmed_at) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 font-medium">Quotation Order #:</span>
                                    <p className="text-sm text-gray-700">
                                        <Link to={`/orders/${sale.order.id}`} className="text-orange-500 hover:underline">
                                            {sale.order.order_no}
                                        </Link>
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-sm text-gray-600 font-medium">Owner/Unit/Property:</span>
                                    {sale.order.user ? (
                                        <div className="text-sm text-gray-700 space-y-1">
                                            <p className="font-semibold">{sale.order.user.name}</p>
                                            <p>Unit: {sale.order.block}-{sale.order.floor}-{sale.order.unit_no}</p>
                                            <p>Property: {sale.order.property ? sale.order.property.name : 'Not specified'} - Type {sale.order.unit_type || 'N/A'}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No owner information available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Invoices Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Invoices</h3>
                            {sale.invoices.length > 0 ? (
                                <div className="space-y-3">
                                    {sale.invoices.map((invoice: Invoice, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <Link
                                                    to={'/sales/' + sale.id + '?inv=' + invoice.id}
                                                    state={{ fromUrl: '/finance/sales-order-po' }}
                                                    className="text-orange-500 font-semibold hover:underline"
                                                >
                                                    {invoice.invoice_no}
                                                </Link>
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <span className="text-gray-600">Amount:</span> RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <span className="text-gray-600">Status:</span>{' '}
                                                <span className={`capitalize ${invoice.status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <span className="text-gray-600">Paid Amount:</span>{' '}
                                                RM {(sale.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <span className="text-gray-600">Paid %:</span>{' '}
                                                {sale.order.total_amount > 0
                                                    ? ((sale.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0) / sale.order.total_amount) * 100).toFixed(2) + '%'
                                                    : '0%'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No invoices available</p>
                            )}
                        </div>

                        {/* Purchase Orders Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Purchase Orders</h3>
                            {sale.purchase_orders.length > 0 ? (
                                <div className="space-y-4">
                                    {sale.purchase_orders.map((po, idx) => (
                                        <div key={idx} className="bg-gray-100 rounded-lg">
                                            {/* PO Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-200">
                                                <div className="flex-1">
                                                    <span className="text-sm text-gray-600 font-medium">PO #:</span>{' '}
                                                    <Link
                                                        to={`/purchase-orders/${po.id}`}
                                                        className="text-orange-500 font-semibold text-base hover:underline"
                                                    >
                                                        {po.po_no}
                                                    </Link>
                                                </div>
                                                <div className="flex-1 text-sm">
                                                    <span className="text-gray-600 font-medium">Total Amount:</span>{' '}
                                                    <span className="font-semibold text-gray-800">
                                                        RM {po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* PO Invoices */}
                                            {po.invoices.length > 0 ? (
                                                <div className="p-4 bg-white rounded-b-lg">
                                                    <div className="space-y-3">
                                                        {po.invoices.map((invoice: Invoice, index) => (
                                                            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-2 bg-gray-50 rounded-md">
                                                                <div className="flex-1">
                                                                    <Link
                                                                        to={'/purchase-orders/' + po.id + '/invoices?inv=' + invoice.id}
                                                                        state={{ fromUrl: '/purchase-orders/property/view' }}
                                                                        className="text-orange-500 hover:underline"
                                                                    >
                                                                        {invoice.invoice_no}
                                                                    </Link>
                                                                </div>
                                                                <div className="flex-1 text-sm">
                                                                    <span className="text-gray-600">Amount:</span>{' '}
                                                                    RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </div>
                                                                <div className="flex-1 text-sm">
                                                                    <span className="text-gray-600">Status:</span>{' '}
                                                                    <span className={`capitalize ${invoice.status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                                                                        {invoice.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 text-sm">
                                                                    <span className="text-gray-600">Paid Amount:</span>{' '}
                                                                    RM {(po.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </div>
                                                                <div className="flex-1 text-sm">
                                                                    <span className="text-gray-600">Paid %:</span>{' '}
                                                                    {po.total_amount > 0
                                                                        ? ((po.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0) / po.total_amount) * 100).toFixed(2) + '%'
                                                                        : '0%'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic p-4 bg-white rounded-b-lg">No invoices for this PO</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No purchase orders available</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {isLoading && <Loading />}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">Sales Order PO</span>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">Sale Overview</div>
                        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                            <button className="btn-refresh" onClick={handleRefreshTable}>
                                <i className="ki-solid ki-arrows-circle text-lg"></i>
                            </button>
                            <div className="flex">
                                <label className="input input-sm">
                                    <i className="ki-filled ki-magnifier"></i>
                                    <input
                                        placeholder="Search sales..."
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        {sales.map((sale, index) => renderSaleCard(sale, index))}
                    </div>

                    <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
                        <div className="flex items-center gap-2">
                            Show
                            <select
                                className="select select-sm w-16"
                                name="perpage"
                                value={size}
                                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="50">50</option>
                            </select>
                            per page
                        </div>
                        <div className="flex items-center gap-4">
                            <span>
                                {(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}
                            </span>
                            <div className="pagination">
                                <button
                                    className={`btn ${page === 1 ? "disabled" : ""}`}
                                    onClick={() => handlePageChange(page - 1)}
                                >
                                    <i className="ki-outline ki-black-left"></i>
                                </button>
                                {totalPages > 0 && (
                                    <>
                                        {page > 3 && (
                                            <>
                                                <button className="btn" onClick={() => handlePageChange(1)}>
                                                    1
                                                </button>
                                                <span className="btn btn-disabled">...</span>
                                            </>
                                        )}
                                        {Array.from({ length: Math.min(3, totalPages) }, (_, index) => {
                                            const startPage = Math.max(1, Math.min(page - 1, totalPages - 2));
                                            return (
                                                <button
                                                    key={startPage + index}
                                                    className={`btn ${page === startPage + index ? "active" : ""}`}
                                                    onClick={() => handlePageChange(startPage + index)}
                                                >
                                                    {startPage + index}
                                                </button>
                                            );
                                        })}
                                        {page < totalPages - 2 && (
                                            <>
                                                <span className="btn btn-disabled">...</span>
                                                <button className="btn" onClick={() => handlePageChange(totalPages)}>
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                <button
                                    className={`btn ${page === totalPages ? "disabled" : ""}`}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    <i className="ki-outline ki-black-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SalesOrderPO;