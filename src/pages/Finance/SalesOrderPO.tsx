import React, { useEffect, useRef, useState } from 'react'
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

function SalesOrderPO() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [sales, setSales] = useState<Sale[]>([]); // Initialize as an empty array
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<FilterOption[]>([]);
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

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
            // Convert FilterOption array to FilterParams object
            const filterParams = filters.reduce((acc, curr) => {
                acc[curr.column] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            const response = await salesIndex(size, page, searchTerm, order, field, filterParams);

            const data = response?.data || [];
            setSales(data);

            setTotalItems(response?.totalCount || 0);
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

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);

            try {
                setIsLoading(true);
                const response = await salesIndex(size, 1, value, sortOrder, sortField);

                const data = response?.data || [];
                setSales(data);
                setTotalItems(response?.totalCount || 0);
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
        setPage(1); // Reset to the first page when changing the page size
        initSalesTable(1, newSize, searchTerm, sortOrder, sortField, filter);
    };

    const totalPages = Math.ceil(totalItems / size);

    return <>
        {/* Loading Overlay */}
        {isLoading && <Loading />}

        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center flex-wrap">
                <span className="text-2xl font-bold text-gray-900">
                    Sales Order PO
                </span>
                <div className="flex gap-3 flex-wrap">
                </div>
            </div>

            <div className="flex items-center">
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
                        <div className="flex flex-wrap gap-2.5"></div>
                    </div>
                </div>

                <div className="card-table">
                    <table className="table align-middle text-gray-700 font-medium text-sm">
                        <thead>
                            <tr>
                                <th className="w-[100px]">QUO #</th>
                                <th className="w-[100px]">QUO Amount</th>
                                <th className="w-[100px]">Date (Owner Approved)</th>
                                <th className="w-[100px]">Sales Order #</th>
                                <th className="w-[110px]">Invoice #</th>
                                <th className="w-[100px]">Invoice Amount</th>
                                <th className="w-[100px]">Invoice Status</th>
                                <th className="w-[100px]">Invoice Paid Amount</th>
                                <th className="w-[100px]">Invoice Paid %</th>
                                <th className="w-[100px]">PO #</th>
                                <th className="w-[100px]">Total PO Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale, index) => {
                                const invoiceCount = sale.invoices.length;
                                const poCount = sale.purchase_orders.length;
                                const totalRows = Math.max(invoiceCount, poCount) || 0;
                                let cumulativePaidAmount = 0;

                                return totalRows > 0 ? (
                                    Array.from({ length: totalRows }).map((_, rowIdx) => {
                                        if (rowIdx < invoiceCount) {
                                            cumulativePaidAmount += (sale.invoices[rowIdx].amount) || 0;
                                        }

                                        return (
                                            <tr key={`${index}-${rowIdx}`} className="odd:bg-gray-100">
                                                {rowIdx === 0 ? (
                                                    <>

                                                        <td className="align-top">
                                                            <Link
                                                                to={'/orders/' + sale.order.id}
                                                                state={{ fromUrl: '/finance/sales-order-po' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="link text-orange-500"
                                                            >
                                                                {sale.order.order_no}
                                                            </Link>
                                                        </td>
                                                        <td className="align-top">
                                                            RM {sale.order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="align-top">
                                                            {sale.order.confirmed_at}
                                                        </td>
                                                        <td className="align-top">
                                                            <Link
                                                                to={'/sales/' + sale.id}
                                                                state={{ fromUrl: '/finance/sales-order-po' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="link text-orange-500"
                                                            >
                                                                {sale.sales_no}
                                                            </Link>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                    </>
                                                )}
                                                {/* Invoice Columns */}
                                                {rowIdx < invoiceCount ? (
                                                    <>
                                                        <td style={{ paddingLeft: '1rem' }}>{sale.invoices[rowIdx].invoice_no}</td>
                                                        <td>RM {sale.invoices[rowIdx].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        <td className='text-center'>
                                                            <span className={`badge badge-pill p-2 cursor-default capitalize
                                                                ${sale.invoices[rowIdx].status === 'issued' ? 'badge-primary' : ''} 
                                                                ${sale.invoices[rowIdx].status === 'paid' ? 'badge-success' : ''} 
                                                                ${sale.invoices[rowIdx].status === 'overdue' ? 'badge-danger' : ''} 
                                                                badge-outline`}
                                                            >
                                                                {sale.invoices[rowIdx].status.replace(/-/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            RM {cumulativePaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td>
                                                            {sale.order.total_amount > 0
                                                                ? ((cumulativePaidAmount / sale.order.total_amount) * 100).toFixed(2) + '%'
                                                                : '0%'}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                    </>
                                                )}
                                                {/* PO Columns */}
                                                {rowIdx < poCount ? (
                                                    <>
                                                        <td style={{ paddingLeft: '1rem' }}>
                                                            <Link
                                                                to={'/purchase-orders/' + sale.purchase_orders[rowIdx].id}
                                                                state={{ fromUrl: '/finance/sales-order-po' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="link text-orange-500"
                                                            >
                                                                {sale.purchase_orders[rowIdx].po_no}
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            RM {sale.purchase_orders[rowIdx].total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td></td>
                                                        <td></td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr key={index} className="odd:bg-gray-100">
                                        <td>
                                            <Link
                                                to={'/orders/' + sale.order.id}
                                                state={{ fromUrl: '/finance/sales-order-po' }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="link text-orange-500"
                                            >
                                                {sale.order.order_no}
                                            </Link>
                                        </td>
                                        <td>RM {sale.order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td>{sale.order.confirmed_at}</td>
                                        <td>
                                            <Link
                                                to={'/sales/' + sale.id}
                                                state={{ fromUrl: '/finance/sales-order-po' }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="link text-orange-500"
                                            >
                                                {sale.sales_no}
                                            </Link>
                                        </td>
                                        <td colSpan={5}>-</td>
                                        <td colSpan={2}>-</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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
                                        const currentPage = startPage + index;
                                        return (
                                            <button
                                                key={currentPage}
                                                className={`btn ${page === currentPage ? "active" : ""}`}
                                                onClick={() => handlePageChange(currentPage)}
                                            >
                                                {currentPage}
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
        </div >
    </>
}

export default SalesOrderPO;