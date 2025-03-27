import React, { useEffect, useRef, useState } from 'react';
import Loading from '../../components/Loading';
import { salesIndex } from '../../services/api';
import { Sale } from '../../types';
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
            // Initialize all cards as expanded
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
                // Initialize all cards as expanded
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
        const invoiceCount = sale.invoices.length;
        const poCount = sale.purchase_orders.length;
        const totalRows = Math.max(invoiceCount, poCount) || 0;
        let cumulativePaidAmount = 0;
        const isExpanded = expandedCards[sale.id] ?? true;

        // Determine if the card is at an odd index (0-based index, so odd indices are 1, 3, 5, etc.)
        const isOdd = index % 2 === 1;

        return (
            <div className="card mb-4" key={sale.id}>
                <div
                    className={`card-header flex justify-between items-center cursor-pointer ${isOdd ? 'bg-gray-200' : ''}`}
                    onClick={() => toggleCard(sale.id)}
                >
                    <div className="card-title">
                        QUO #{sale.order.order_no} - RM {sale.order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <button className="btn btn-sm btn-icon">
                        <i className={`ki-outline ${isExpanded ? 'ki-up' : 'ki-down'}`}></i>
                    </button>
                </div>
                {isExpanded && (
                    <div className="card-table">
                        {/* Rest of the table content remains unchanged */}
                        <table className="table align-middle text-gray-700 font-medium text-sm">
                            <thead>
                                <tr>
                                    <th className="w-[100px]">Date (Owner Approved)</th>
                                    <th className='w-[100px]'>Owner/Unit/Property</th>
                                    <th className="w-[100px]">Sales Order #</th>
                                    <th className="w-[110px]">Invoice #</th>
                                    <th className="w-[100px]">Invoice Amount</th>
                                    <th className="w-[100px] text-center">Invoice Status</th>
                                    <th className="w-[100px]">Invoice Paid Amount</th>
                                    <th className="w-[100px]">Invoice Paid %</th>
                                    <th className="w-[100px]">PO #</th>
                                    <th className="w-[100px]">Total PO Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Table body content remains unchanged */}
                                {totalRows > 0 ? (
                                    Array.from({ length: totalRows }).map((_, rowIdx) => {
                                        if (rowIdx < invoiceCount) {
                                            cumulativePaidAmount += (sale.invoices[rowIdx].amount) || 0;
                                        }

                                        return (
                                            <tr key={`${sale.id}-${rowIdx}`} className="odd:bg-gray-100">
                                                {/* Row content remains unchanged */}
                                                {rowIdx === 0 ? (
                                                    <>
                                                        <td className="align-top">
                                                            {sale.order.confirmed_at ? formatDate(sale.order.confirmed_at) : ''}
                                                        </td>
                                                        <td className="align-top">
                                                            <div className="flex flex-col gap-2">
                                                                {sale.order.user ? (
                                                                    <div className="space-y-2">
                                                                        <div className="text-base font-semibold text-gray-800">
                                                                            {sale.order.user.name}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm text-gray-600 font-medium">Unit:</span>
                                                                            <span className="text-sm text-gray-700">
                                                                                {sale.order.block}-{sale.order.floor}-{sale.order.unit_no}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm text-gray-600 font-medium">Property:</span>
                                                                            <span className="text-sm text-gray-700">
                                                                                {sale.order.property ? sale.order.property.name : 'Not specified'} - Type  {sale.order.unit_type || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400 italic">No owner information available</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="align-top">
                                                            <Link to={`/orders/${sale.order.id}`} className="link text-orange-500">
                                                                {sale.order.order_no}
                                                            </Link>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                    </>
                                                )}
                                                <td className="align-top">
                                                    {rowIdx < invoiceCount ? sale.invoices[rowIdx].invoice_no : ''}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx < invoiceCount ?
                                                        `RM ${sale.invoices[rowIdx].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                                </td>
                                                <td className="text-center align-top">
                                                    {rowIdx < invoiceCount && (
                                                        <span className={`badge badge-pill p-2 cursor-default capitalize
                                                            ${sale.invoices[rowIdx].status === 'issued' ? 'badge-primary' : ''} 
                                                            ${sale.invoices[rowIdx].status === 'paid' ? 'badge-success' : ''} 
                                                            ${sale.invoices[rowIdx].status === 'overdue' ? 'badge-danger' : ''} 
                                                            badge-outline`}>
                                                            {sale.invoices[rowIdx].status.replace(/-/g, ' ')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx < invoiceCount ?
                                                        `RM ${cumulativePaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx < invoiceCount ?
                                                        (sale.order.total_amount > 0
                                                            ? ((cumulativePaidAmount / sale.order.total_amount) * 100).toFixed(2) + '%'
                                                            : '0%') : ''}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx < poCount && (
                                                        <Link to={`/purchase-orders/${sale.purchase_orders[rowIdx].id}`} className="link text-orange-500">
                                                            {sale.purchase_orders[rowIdx].po_no}
                                                        </Link>
                                                    )}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx < poCount ?
                                                        `RM ${sale.purchase_orders[rowIdx].total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr className="odd:bg-gray-100">
                                        <td>{sale.order.confirmed_at ? formatDate(sale.order.confirmed_at) : ''}</td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                {sale.order.user ? (
                                                    <div className="space-y-2">
                                                        <div className="text-base font-semibold text-gray-800">
                                                            {sale.order.user.name}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600 font-medium">Unit:</span>
                                                            <span className="text-sm text-gray-700">
                                                                {sale.order.block}-{sale.order.floor}-{sale.order.unit_no}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600 font-medium">Property:</span>
                                                            <span className="text-sm text-gray-700">
                                                                {sale.order.property ? sale.order.property.name : 'Not specified'} - Type  {sale.order.unit_type || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No owner information available</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <Link to={`/orders/${sale.order.id}`} className="link text-orange-500">
                                                {sale.order.order_no}
                                            </Link>
                                        </td>
                                        <td>-</td>
                                        <td>RM {sale.order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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