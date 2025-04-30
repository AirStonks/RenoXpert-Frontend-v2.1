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
            const newSales: Sale[] = response?.data || [];
            setSales(newSales);
            setTotalItems(response?.totalCount || 0);
            // Initialize all cards as expanded
            setExpandedCards(newSales.reduce((acc: Record<string, boolean>, sale: Sale) => ({
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
                const newSales: Sale[] = response?.data || [];
                setSales(newSales);
                setTotalItems(response?.totalCount || 0);
                // Initialize all cards as expanded
                setExpandedCards(newSales.reduce((acc: Record<string, boolean>, sale: Sale) => ({
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
        const totalRows = Math.max(poCount) || 0;
        let cumulativePaidAmount = 0;
        const isExpanded = expandedCards[sale.id] ?? true;

        const isOdd = index % 2 === 1;

        return (
            <div className="card mb-4" key={sale.id}>
                <div
                    className={`card-header flex justify-between items-center cursor-pointer ${isOdd ? 'bg-gray-200' : ''}`}
                    onClick={() => toggleCard(sale.id)}
                >
                    <div className="card-title">
                        <Link
                            to={'/sales/' + sale.id}
                            state={{ fromUrl: '/finance/sales-order-po' }}
                            className='link text-orange-500'
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            #{sale.sales_no}
                        </Link>
                        - RM {sale.order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <button className="btn btn-sm btn-icon">
                        <i className={`ki-outline ${isExpanded ? 'ki-up' : 'ki-down'}`}></i>
                    </button>
                </div>
                {isExpanded && (
                    <div className="card-table">
                        <table className="table align-middle text-gray-700 font-medium text-sm">
                            <thead>
                                <tr>
                                    <th className="w-[100px]">Date (Owner Approved)</th>
                                    <th className='w-[100px]'>Owner/Unit/Property</th>
                                    <th className="w-[100px]">Quotation Order #</th>
                                    <th className="w-[120px]">Sales Order #</th>
                                    <th className="w-[100px]">Invoice Amount</th>
                                    <th className="w-[80px]">Invoice Status</th>
                                    <th className="w-[100px]">Invoice Paid Amount</th>
                                    <th className="w-[80px]">Invoice Paid %</th>
                                    <th className="w-[100px]">PO #</th>
                                    <th className="w-[100px]">Total PO Amount</th>
                                    <th className="w-[120px]">PO Invoices #</th>
                                    <th className="w-[100px]">PO Invoice Amount</th>
                                    <th className="w-[80px]">PO Invoice Status</th>
                                    <th className="w-[100px]">PO Invoice Paid Amount</th>
                                    <th className="w-[80px]">PO Invoice Paid %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {totalRows > 0 ? (
                                    Array.from({ length: totalRows }).map((_, rowIdx) => {
                                        if (rowIdx < invoiceCount) {
                                            cumulativePaidAmount += (sale.invoices[rowIdx].amount) || 0;
                                        }

                                        return (
                                            <tr key={`${sale.id}-${rowIdx}`} className="odd:bg-gray-100">
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
                                                    {rowIdx === 0 && (
                                                        <>
                                                            {sale.invoices.length > 0 ? (
                                                                <ul className="list-disc list-inside text-sm">
                                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                            <Link
                                                                                to={'/purchase-orders/' + sale.id + '/invoices?inv=' + invoice.id}
                                                                                state={{ fromUrl: '/purchase-orders/property/view' }}
                                                                                className="font-semibold cursor-pointer text-orange-500">
                                                                                {invoice.invoice_no}
                                                                            </Link>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-gray-500 italic">No invoices</span>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx === 0 && (
                                                        <>
                                                            {sale.invoices.length > 0 ? (
                                                                <ul className="list-disc list-inside text-sm">
                                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                            RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-gray-500 italic">-</span>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx === 0 && (
                                                        <>
                                                            {sale.invoices.length > 0 ? (
                                                                <ul className="list-disc list-inside text-sm">
                                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                                        <li key={index} className={`capitalize ${invoice.status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                                                                            {invoice.status}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-gray-500 italic">-</span>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx === 0 && (
                                                        <>
                                                            {sale.invoices.length > 0 ? (
                                                                <ul className="list-disc list-inside text-sm">
                                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                            RM {(sale.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-gray-500 italic">No payments</span>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="align-top">
                                                    {rowIdx === 0 && (
                                                        <>
                                                            {sale.invoices.length > 0 ? (
                                                                <ul className="list-disc list-inside text-sm">
                                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                            {sale.order.total_amount > 0
                                                                                ? ((sale.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0) / sale.order.total_amount) * 100).toFixed(2) + '%'
                                                                                : '0%'}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-gray-500 italic">N/A</span>
                                                            )}
                                                        </>
                                                    )}
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
                                                <td className="align-top">
                                                    {sale.purchase_orders[rowIdx].invoices.length > 0 ? (
                                                        <ul className="list-disc list-inside text-sm">
                                                            {sale.purchase_orders[rowIdx].invoices.map((invoice: Invoice, index) => (
                                                                <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                    <Link
                                                                        to={'/purchase-orders/' + sale.purchase_orders[rowIdx].id + '/invoices?inv=' + invoice.id}
                                                                        state={{ fromUrl: '/purchase-orders/property/view' }}
                                                                        className="font-semibold cursor-pointer text-orange-500">
                                                                        {invoice.invoice_no}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-500 italic">No invoices</span>
                                                    )}
                                                </td>
                                                <td className='align-top'>
                                                    {sale.purchase_orders[rowIdx].invoices.length > 0 ? (
                                                        <ul className="list-disc list-inside text-sm">
                                                            {sale.purchase_orders[rowIdx].invoices.map((invoice: Invoice, index) => (
                                                                <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                    RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-500 italic">-</span>
                                                    )}
                                                </td>
                                                <td className='align-top'>
                                                    {sale.purchase_orders[rowIdx].invoices.length > 0 ? (
                                                        <ul className="list-disc list-inside text-sm">
                                                            {sale.purchase_orders[rowIdx].invoices.map((invoice: Invoice, index) => (
                                                                <li key={index} className={`capitalize ${invoice.status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {invoice.status}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-500 italic">-</span>
                                                    )}
                                                </td><td className="align-top">
                                                    {sale.purchase_orders[rowIdx].invoices.length > 0 ? (
                                                        <ul className="list-disc list-inside text-sm">
                                                            {sale.purchase_orders[rowIdx].invoices.map((invoice: Invoice, index) => (
                                                                <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                    RM {(sale.purchase_orders[rowIdx].invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-500 italic">No payments</span>
                                                    )}
                                                </td>
                                                <td className="align-top">
                                                    {sale.purchase_orders[rowIdx].invoices.length > 0 ? (
                                                        <ul className="list-disc list-inside text-sm">
                                                            {sale.purchase_orders[rowIdx].invoices.map((invoice: Invoice, index) => (
                                                                <li key={index} className="text-gray-700 dark:text-gray-200">
                                                                    {sale.purchase_orders[rowIdx].total_amount > 0
                                                                        ? ((sale.purchase_orders[rowIdx].invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0) / sale.purchase_orders[rowIdx].total_amount) * 100).toFixed(2) + '%'
                                                                        : '0%'}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-500 italic">N/A</span>
                                                    )}
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
                                        <td>
                                            {sale.invoices.length > 0 ? (
                                                <ul className="list-disc list-inside text-sm">
                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                            <Link
                                                                to={'/sales/' + sale.id + '?inv=' + invoice.id}
                                                                state={{ fromUrl: '/finance/sales-order-po' }}
                                                                className="font-semibold cursor-pointer text-orange-500">
                                                                {invoice.invoice_no}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-500 italic">No invoices</span>
                                            )}
                                        </td>
                                        <td>
                                            {sale.invoices.length > 0 ? (
                                                <ul className="list-disc list-inside text-sm">
                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                            RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-500 italic">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {sale.invoices.length > 0 ? (
                                                <ul className="list-disc list-inside text-sm">
                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                        <li key={index} className={`capitalize ${invoice.status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                                                            {invoice.status}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-500 italic">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {sale.invoices.length > 0 ? (
                                                <ul className="list-disc list-inside text-sm">
                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                            RM {(sale.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-500 italic">No payments</span>
                                            )}
                                        </td>
                                        <td>
                                            {sale.invoices.length > 0 ? (
                                                <ul className="list-disc list-inside text-sm">
                                                    {sale.invoices.map((invoice: Invoice, index) => (
                                                        <li key={index} className="text-gray-700 dark:text-gray-200">
                                                            {sale.order.total_amount > 0
                                                                ? ((sale.invoices.slice(0, index + 1).reduce((sum, inv) => sum + (inv.amount || 0), 0) / sale.order.total_amount) * 100).toFixed(2) + '%'
                                                                : '0%'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-500 italic">N/A</span>
                                            )}
                                        </td>
                                        <td>-</td>
                                        <td>-</td>
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