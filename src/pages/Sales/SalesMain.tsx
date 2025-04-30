// src\pages\Sales\SalesMain.tsx

import { useEffect, useRef, useState } from 'react';
import Loading from '../../components/Loading';
import { Property, Sale } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { propertyIndex, salesIndex } from '../../services/api';
// import CreatePropertyModal from '../../components/Modals/CreatePropertyModal';

export type SortOrder = 'asc' | 'desc' | null;

interface FilterOption {
    column: string;
    value: string;
    label?: string;
}

function SalesMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [sales, setSales] = useState<Sale[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<FilterOption[]>([]);
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const [properties, setProperties] = useState<Property[]>([]);

    const [selectedQuotation, setSelectedQuotation] = useState<{ id: number | string, name: string } | null>(null);

    useEffect(() => {
        document.title = "Sales | RenoXpert";
        initSalesTable(1, 10, '', null, '');
        initProperties(1, 10, '', null, '');
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
            setError('Failed to load sales');
        } finally {
            setIsLoading(false);
        }
    };

    const initProperties = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await propertyIndex(100, 1, '', 'asc', '');

            const data = response?.data || [];
            setProperties(data);
        } catch (error) {
            console.error('Error fetching properties:', error);
            setError('Failed to load properties');
        } finally {
            setIsLoading(false);
        }
    }

    const handleRefreshTable = async () => {
        initSalesTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleFilterTable = async (field: string, value: string, label?: string) => {
        const filterIndex = filter.findIndex(f => f.column === field);

        if (filterIndex !== -1) {
            // If filter with same column exists, replace it
            setFilter(prevFilter => {
                const newFilters = [...prevFilter];
                newFilters[filterIndex] = {
                    column: field,
                    value: value,
                    ...(label && { label })
                };
                return newFilters;
            });
        } else {
            // If no filter with this column exists, add new filter
            const newFilter = {
                column: field,
                value: value,
                ...(label && { label })
            };
            setFilter(prevFilter => [...prevFilter, newFilter]);
        }

        setPage(1);
        // Use updated filter state by awaiting the state update
        const updatedFilters = filterIndex !== -1
            ? filter.map(f => f.column === field ? { column: field, value: value, ...(label && { label }) } : f)
            : [...filter, { column: field, value: value, ...(label && { label }) }];

        await initSalesTable(1, size, searchTerm, sortOrder, sortField, updatedFilters);
    };


    const handleClearFilterTable = async (field: string) => {
        // Remove the filter with the specified column
        const updatedFilters = filter.filter(f => f.column !== field);

        // Update the filter state
        setFilter(updatedFilters);

        // Reset to page 1 and refresh the table with the updated filters
        setPage(1);
        await initSalesTable(1, size, searchTerm, sortOrder, sortField, updatedFilters);
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
                setError('Failed to search products');
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

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
            if (sortOrder === null) {
                setSortOrder('asc');
                initSalesTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initSalesTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initSalesTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initSalesTable(page, size, searchTerm, 'asc', field);
        }
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) {
            return <i className="ki-outline ki-arrow-up-down text-gray-400" />;
        }
        switch (sortOrder) {
            case 'asc':
                return <i className="ki-outline ki-arrow-up text-primary" />;
            case 'desc':
                return <i className="ki-outline ki-arrow-down text-primary" />;
            default:
                return <i className="ki-outline ki-arrow-up-down text-gray-400" />;
        }
    };


    const totalPages = Math.ceil(totalItems / size);

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Sales
                    </span>
                    <div className="flex gap-3 flex-wrap">

                    </div>
                </div>

                {/* <div className="card">
                    <div className="card-body p-3">
                        <div className="flex gap-4">
                            <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-start" data-dropdown-trigger="click">
                                <button
                                    className="dropdown-toggle btn btn-sm rounded-md btn-clear items-center gap-2 text-gray-900 hover:bg-gray-200"
                                >
                                    <i className="ki-filled ki-filter"></i>
                                    <span className='font-semibold'>Filter</span>
                                </button>
                                <div className="dropdown-content w-full max-w-2xl py-4 px-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <h2 className='font-medium'>Advanced filters</h2>
                                            <button className="btn btn-sm btn-light">
                                                Clear all
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-start" data-dropdown-trigger="click">
                                                <button
                                                    className="dropdown-toggle btn btn-sm rounded-md btn-light items-center gap-2 text-gray-900 hover:bg-gray-200"
                                                >
                                                    <span className='font-semibold'>Field</span>
                                                    <i className="ki-outline ki-down"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <button className="btn btn-sm rounded-md btn-clear items-center gap-2 text-gray-900 hover:bg-gray-200">
                                                <i className="ki-filled ki-plus"></i>
                                                <span className=''>Add new filter</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}

                <div className="flex items-center">
                    <span className='font-semibold mr-4'>Quick Filter: </span>

                    <div className="flex gap-2">
                        <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-start" data-dropdown-trigger="click">
                            <button
                                className={`dropdown-toggle btn btn-sm rounded-full btn-light ${filter.find(f => f.column === 'status') ? 'btn-success btn-outline' : ''}`}
                            >
                                {/* ${filter === 'confirmed' ? 'btn-success btn-outline' : 'btn-light'} */}
                                {`Payment Status ${filter.find(f => f.column === 'status') ? `= ${filter.find(f => f.column === 'status')?.label}` : ''}`}

                                {
                                    filter.find(f => f.column === 'status') &&
                                    <i
                                        className="ki-filled ki-cross"
                                        onClick={(e) => [
                                            e.stopPropagation(),
                                            handleClearFilterTable('status')
                                        ]}
                                    ></i>
                                }
                            </button>

                            <div className="dropdown-content menu menu-default w-full max-w-64 py-2">
                                <div className="menu-item mx-[10px] px-[10px] py-1">
                                    <div className="text-[13px] font-medium text-gray-600 cursor-default">
                                        Payment Status
                                    </div>
                                </div>
                                <div className="menu-item" data-dropdown-dismiss="true">
                                    <button
                                        className="menu-link copy-link"
                                        onClick={() => handleFilterTable('status', 'issued', 'Issued')}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span className="">
                                                    Issued
                                                </span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                                <div className="menu-item" data-dropdown-dismiss="true">
                                    <button
                                        className="menu-link copy-link"
                                        onClick={() => handleFilterTable('status', 'partial-paid', 'Partial Paid')}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span className="">
                                                    Partial Paid
                                                </span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                                <div className="menu-item" data-dropdown-dismiss="true">
                                    <button
                                        className="menu-link copy-link"
                                        onClick={() => handleFilterTable('status', 'paid', 'Paid')}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span className="">
                                                    Paid
                                                </span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-start" data-dropdown-trigger="click">
                            <button
                                className={`dropdown-toggle btn btn-sm rounded-full btn-light ${filter.find(f => f.column === 'property_id') ? 'btn-success btn-outline' : ''} `}
                            >
                                {/* ${filter === 'confirmed' ? 'btn-success btn-outline' : 'btn-light'} */}
                                {`Property ${filter.find(f => f.column === 'property_id') ? `= ${filter.find(f => f.column === 'property_id')?.label}` : ''}`}

                                {
                                    filter.find(f => f.column === 'property_id') &&
                                    <i
                                        className="ki-filled ki-cross"
                                        onClick={(e) => [
                                            e.stopPropagation(),
                                            handleClearFilterTable('property_id')
                                        ]}
                                    ></i>
                                }
                            </button>

                            <div className="dropdown-content menu menu-default w-full max-w-64 py-2 max-h-96 overflow-y-auto">
                                <div className="menu-item mx-[10px] px-[10px] py-1">
                                    <div className="text-[13px] font-medium text-gray-600 cursor-default">
                                        Property
                                    </div>
                                </div>
                                {properties.map((property, index) => (
                                    <div className="menu-item" data-dropdown-dismiss="true" key={index}>
                                        <button
                                            className="menu-link copy-link"
                                            onClick={() => handleFilterTable('property_id', property.id, property.name)}
                                        >
                                            <span className="menu-title">
                                                <div className="flex gap-2 items-center">
                                                    <span className="">
                                                        {property.name}
                                                    </span>
                                                </div>
                                            </span>
                                        </button>
                                    </div>
                                ))}
                                {/* <div className="menu-item" data-dropdown-dismiss="true">
                                    <button
                                        className="menu-link copy-link"
                                        onClick={() => handleFilterTable('status', 'issued', 'Issued')}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span className="">
                                                    Issued
                                                </span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                                <div className="menu-item" data-dropdown-dismiss="true">
                                    <button
                                        className="menu-link copy-link"
                                        onClick={() => handleFilterTable('status', 'partial-paid', 'Partial Paid')}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span className="">
                                                    Partial Paid
                                                </span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                                <div className="menu-item" data-dropdown-dismiss="true">
                                    <button
                                        className="menu-link copy-link"
                                        onClick={() => handleFilterTable('status', 'paid', 'Paid')}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span className="">
                                                    Paid
                                                </span>
                                            </div>
                                        </span>
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Sale Overview
                        </div>
                        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                            <button
                                className="btn-refresh"
                                onClick={handleRefreshTable}
                            >
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
                            <div className="flex flex-wrap gap-2.5">
                                {/* <select className="select select-sm w-28">
                                    <option value="1">
                                        Latest
                                    </option>
                                    <option value="2">
                                        Older
                                    </option>
                                    <option value="3">
                                        Oldest
                                    </option>
                                </select>
                                <button className="btn btn-sm btn-outline btn-primary">
                                    <i className="ki-filled ki-setting-4">
                                    </i>
                                    Filters
                                </button>
                                <label className="switch switch-sm">
                                    <input className="order-2" name="check" type="checkbox" value="1" />
                                    <span className="switch-label order-1">Push Alerts</span>
                                </label> */}
                            </div>
                        </div>
                    </div>
                    <div className="card-table">
                        <table className="table align-middle text-gray-700 font-medium text-sm">
                            <thead>
                                <tr>
                                    <th className='w-[100px]'>Sales Order No.</th>
                                    <th className='w-[100px]'>Quotation No.</th>
                                    <th className='w-[100px] text-center'>Status</th>
                                    <th className='w-[100px] text-center'>Owner</th>
                                    <th className='w-[60px] text-center'>Unit</th>
                                    <th className='w-[60px] text-center'>Property</th>
                                    <th className='w-[120px] text-center'>Total Amount</th>
                                    <th className='w-[80px] text-center'>Paid Amount</th>
                                    <th className='w-[150px] text-center'>Balance</th>
                                    <th className='w-[50px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.length > 0 ? (
                                    sales.map((sale, saleIndex) => (
                                        <tr
                                            key={saleIndex}
                                            className={`${saleIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <Link
                                                        to={'/sales/' + sale.id}
                                                        className="cursor-pointer text-orange-500"
                                                        data-action="view"
                                                    >
                                                        {sale.sales_no}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className=''>
                                                <div className="flex flex-col gap-1">
                                                    <Link
                                                        to={'/orders/' + sale.order_id}
                                                        className="cursor-pointer text-orange-500"
                                                        data-action="view"
                                                    >
                                                        {sale.order.order_no}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <span className={`badge badge-pill p-2 cursor-default capitalize
                                                    ${sale.status === 'issued' ? 'badge-primary' : ''} 
                                                    ${sale.status === 'partial-paid' ? 'badge-info' : ''} 
                                                    ${sale.status === 'fully-paid' ? 'badge-success' : ''} 
                                                    badge-outline`}
                                                >
                                                    {sale.status.replace(/-/g, ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    {sale.order.user ?
                                                        <>
                                                            <span>{sale.order.user.name}</span>
                                                            <span className="text-xs text-slate-400">{sale.order.user.email}</span>
                                                            <span className="text-xs text-slate-700">+{sale.order.user.country_code} {sale.order.user.phone_no}</span>
                                                        </>
                                                        :
                                                        '-'
                                                    }
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>{sale.order.block}-{sale.order.floor}-{sale.order.unit_no}</span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>{sale.order.property ? sale.order.property.name : '-'}</span>
                                                    <div className="badge">
                                                        <span className="text-xs text-gray-900">{sale.order.unit_type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>
                                                        RM {sale.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>
                                                        RM {(sale.total_amount - sale.remaining_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-center">
                                                        <span className='badge badge-pill'>
                                                            {(sale.remaining_percentage * 100).toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <span>
                                                        RM {sale.remaining_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <div className="dropdown" data-dropdown="true"
                                                        data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                                                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                                                            <i className="ki-filled ki-dots-vertical"></i>
                                                        </button>
                                                        <div className="dropdown-content menu menu-default w-full max-w-64 py-2"
                                                            data-dropdown-dismiss="true">
                                                            <div className="menu-item">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-center text-gray-500">
                                            No sales available
                                        </td>
                                    </tr>
                                )}
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
                            <span>{(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}</span>
                            <div className="pagination">
                                {/* Previous Page Button */}
                                <button
                                    className={`btn ${page === 1 ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(page - 1)}
                                >
                                    <i className="ki-outline ki-black-left"></i>
                                </button>

                                {/* Page Number Buttons with Ellipses */}
                                {totalPages > 0 && (
                                    <>
                                        {page > 3 && (
                                            <>
                                                <button
                                                    className="btn"
                                                    onClick={() => handlePageChange(1)}
                                                >
                                                    1
                                                </button>
                                                <span className="btn btn-disabled">...</span>
                                            </>
                                        )}

                                        {Array.from({
                                            length: Math.min(3, totalPages)
                                        }, (_, index) => {
                                            // Determine the start of the 3-page window
                                            const startPage = Math.max(1,
                                                Math.min(
                                                    page - 1,
                                                    totalPages - 2
                                                )
                                            );

                                            const currentPage = startPage + index;
                                            return (
                                                <button
                                                    key={currentPage}
                                                    className={`btn ${page === currentPage ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(currentPage)}
                                                >
                                                    {currentPage}
                                                </button>
                                            );
                                        })}

                                        {page < totalPages - 2 && (
                                            <>
                                                <span className="btn btn-disabled">...</span>
                                                <button
                                                    className="btn"
                                                    onClick={() => handlePageChange(totalPages)}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Next Page Button */}
                                <button
                                    className={`btn ${page === totalPages ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    <i className="ki-outline ki-black-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <CreatePropertyModal /> */}
            </div >
        </>
    );
}

export default SalesMain;
