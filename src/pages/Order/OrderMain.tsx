import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProperties, orderIndex, releaseOrder, removeOrder, voidOrder } from '../../services/api';
import DeleteModal from '../../components/Modals/DeleteModal';
import { Order, Property } from '../../types';
import { Slide, toast } from 'react-toastify';
import ClipboardJS from 'clipboard';
import ConfirmOrderModal from './components/ConfirmOrderModal';
import VoidQuotationModal from './components/VoidQuotationModal';
import { KTModal } from '../../metronic/core';
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ChevronUpIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/solid';
import {
    PlusIcon,
    XCircle,
    ListFilterIcon,
} from 'lucide-react';
import React from 'react';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const CLIENT_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_CLIENT_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_CLIENT_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/owner/'
                : null;

type SortOrder = 'asc' | 'desc' | null;

type FilterTerms = {
    status: 'all' | 'confirmed' | 'released' | 'unreleased' | 'draft' | 'voided';
    property_id: string;
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'confirmed':
            return 'Sale';
        case 'released':
            return 'Released';
        case 'unreleased':
            return 'Unreleased';
        case 'draft':
            return 'Draft';
        case 'voided':
            return 'Voided';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function OrderMain() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [propertyFilter, setPropertyFilter] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<FilterTerms>({
        status: 'all',
        property_id: '',
    });
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [openDropdowns, setOpenDropdowns] = useState<number[]>([]);
    const [properties, setProperties] = useState<Property[]>([])

    const [selectedOrder, setSelectedOrder] = useState<{ id: number | string, name: string } | null>(null);

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        document.title = "Quotation Orders | RenoXpert";
        initOrderTable(1, 10, '', null, '', filterStatus);

        const getProperties = async () => {
            try {
                const response = await fetchProperties();

                setProperties(response.data);
            } catch (error) {
                notify("error", "Failed to fetch properties")
            }
        }

        getProperties()

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };
    }, []);

    const initOrderTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string,
        status?: FilterTerms
    ) => {
        const filters = [{
            field: 'status',
            value: status.status,
        },
        {
            field: 'property_id',
            value: status.property_id,
        }];

        try {
            setIsLoading(true);
            const response = await orderIndex(size, page, searchTerm, order, field, filters);
            const data = response?.data || [];
            setOrders(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        setPage(1);
        await initOrderTable(1, size, searchTerm, sortOrder, sortField, filterStatus);
        notify('success', 'Orders refreshed');
    };

    const handleFilterTable = async (selectedFilter: "all" | "confirmed" | "released" | "unreleased" | "draft" | "voided") => {
        const newFilter: FilterTerms = {
            status: selectedFilter === filterStatus.status ? 'all' : selectedFilter,
            property_id: propertyFilter,
        };
        setFilterStatus(newFilter);
        setPage(1);
        initOrderTable(1, size, searchTerm, sortOrder, sortField, newFilter);
    };

    const handleFilterProperty = (propertyId: string) => {
        const newFilter: FilterTerms = {
            status: filterStatus.status,
            property_id: propertyId,
        };
        setPropertyFilter(propertyId);
        setFilterStatus(prevStatus => ({
            ...prevStatus,
            property_id: propertyId,
        }));
        setPage(1);
        initOrderTable(1, size, searchTerm, sortOrder, sortField, newFilter);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            initOrderTable(1, size, value, sortOrder, sortField, filterStatus);
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initOrderTable(newPage, size, searchTerm, sortOrder, sortField, filterStatus);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        initOrderTable(1, newSize, searchTerm, sortOrder, sortField, filterStatus);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            if (sortOrder === null) {
                setSortOrder('asc');
                initOrderTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initOrderTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initOrderTable(page, size, searchTerm, null, '');
            }
        } else {
            setSortField(field);
            setSortOrder('asc');
            initOrderTable(page, size, searchTerm, 'asc', field);
        }
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) {
            return <span className="text-gray-400">↕</span>;
        }
        switch (sortOrder) {
            case 'asc':
                return <ChevronUpIcon className="h-4 w-4 text-blue-500" />;
            case 'desc':
                return <ChevronDownIcon className="h-4 w-4 text-blue-500" />;
            default:
                return <span className="text-gray-400">↕</span>;
        }
    };

    const totalPages = Math.ceil(totalItems / size);

    const handleReleaseOrder = async (orderId: number) => {
        setIsLoading(true);
        try {
            const response = await releaseOrder(orderId);
            if (response?.success) {
                notify('success', 'Order released successfully!');
                await handleRefreshTable();
            }
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleRemoveOrder = async (orderId: number) => {
        setIsLoading(true);
        try {
            const response = await removeOrder(orderId);
            if (response?.success) {
                initOrderTable(page, size);
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.log(error);
            return { success: false, message: 'Quotation removal failed' };
        }
        setIsLoading(false);
    }

    const handleVoidQuotation = async () => {
        setIsLoading(true);
        try {
            const response = await voidOrder(selectedOrder.id as number);
            if (response?.success) {
                const modalEl = document.querySelector('#void_quotation_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();
                notify('success', 'Order voided successfully!');
                await handleRefreshTable();
            }
        } catch (error) {
            notify('error', 'Failed to re-release order.');
        } finally {
            setIsLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'released':
                return `bg-blue-100 text-blue-800`;
            case 'confirmed':
                return `bg-green-100 text-green-800`;
            case 'revoked':
            case 'voided':
                return `bg-red-100 text-red-800`;
            case 'draft':
                return `bg-yellow-100 text-yellow-800`;
            default:
                return `bg-gray-100 text-gray-800`;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Quotation Orders</h1>
                        <div className="flex items-center gap-2">
                            <ListFilterIcon className="w-5 h-5 text-gray-600" />
                            <div className="flex gap-2">
                                {[
                                    { key: 'confirmed', label: 'Sales', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
                                    { key: 'released', label: 'Released', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
                                    { key: 'unreleased', label: 'Unreleased', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
                                    { key: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
                                    { key: 'voided', label: 'Voided', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
                                ].map(filter => (
                                    <button
                                        key={filter.key}
                                        className={`btn btn-sm rounded-md btn-light ${filterStatus.status === filter.key ? 'btn-success btn-outline' : 'btn-light'}`}
                                        onClick={() => handleFilterTable(filter.key as FilterTerms['status'])}
                                    >
                                        {filter.label}
                                        {filterStatus.status === filter.key && (
                                            <XCircle className="h-3 w-3" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 w-full lg:w-64 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={propertyFilter}
                            onChange={(e) => handleFilterProperty(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={""}>All Properties</option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>{property.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleRefreshTable}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <Link
                            to={LOCAL_PATH_PREFIX + 'orders/create'}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add New Order
                        </Link>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                    <p>{error}</p>
                    <button onClick={handleRefreshTable} className="mt-2 underline hover:text-red-900">
                        Try Again
                    </button>
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <></>
                // <div className="flex flex-col md:flex-row items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-md">
                //     <div className="flex items-center gap-2 mb-4 md:mb-0">
                //         <span>Show</span>
                //         <select
                //             value={size}
                //             onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                //             className="border rounded-lg px-3 py-1"
                //         >
                //             <option value="5">5</option>
                //             <option value="10">10</option>
                //             <option value="20">20</option>
                //             <option value="30">30</option>
                //             <option value="50">50</option>
                //         </select>
                //         <span>per page</span>
                //     </div>
                //     <div className="flex items-center gap-4">
                //         <span>
                //             {(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}
                //         </span>
                //         <div className="flex gap-2">
                //             <button
                //                 disabled={page === 1}
                //                 onClick={() => handlePageChange(page - 1)}
                //                 className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                //             >
                //                 Previous
                //             </button>
                //             {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                //                 const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
                //                 const currentPage = startPage + index;
                //                 return (
                //                     <button
                //                         key={currentPage}
                //                         onClick={() => handlePageChange(currentPage)}
                //                         className={`px-3 py-1 border rounded-lg ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                //                             }`}
                //                     >
                //                         {currentPage}
                //                     </button>
                //                 );
                //             })}
                //             <button
                //                 disabled={page === totalPages}
                //                 onClick={() => handlePageChange(page + 1)}
                //                 className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                //             >
                //                 Next
                //             </button>
                //         </div>
                //     </div>
                // </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-32">Order No.</th>
                            <th className="px-4 py-3 w-24 text-center">Status</th>
                            <th className="px-4 py-3 w-48">Internal Remark</th>
                            <th className="px-4 py-3 w-40">Owner</th>
                            <th className="px-4 py-3 w-32 text-center">Property</th>
                            <th className="px-4 py-3 w-24 text-center">Unit</th>
                            <th className="px-4 py-3 w-24 text-center">Partition</th>
                            <th className="px-4 py-3 w-32 text-center">Price</th>
                            <th
                                className="px-4 py-3 w-32 text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('created_at')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Created Date {getSortIcon('created_at')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 w-32 text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('updated_at')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Updated Date {getSortIcon('updated_at')}
                                </div>
                            </th>
                            <th className="px-4 py-3 w-16 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            // Skeleton Loader
                            Array.from({ length: 8 }).map((_, index) => (
                                <tr key={index} className="border-b animate-pulse">
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-1">
                                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                                    </td>
                                </tr>
                            ))
                        ) : orders.length > 0 ? (
                            orders.map((order, orderIndex) => (
                                <tr
                                    key={orderIndex}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            to={LOCAL_PATH_PREFIX + `orders/${order.id}`}
                                            className="text-orange-500 hover:text-orange-700 font-medium hover:underline"
                                        >
                                            {order.order_no}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                                            {order.status === 'confirmed' ? getStatusLabel('sale') : getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-600">
                                            {order.internal_remark || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.user ? (
                                            <div className="space-y-1">
                                                <div className="font-medium">{order.user.name}</div>
                                                <div className="text-xs text-gray-500">{order.user.email}</div>
                                                <div className="text-xs text-gray-500">+{order.user.country_code} {order.user.phone_no}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="space-y-1">
                                            <div className="font-medium">{order.property ? order.property.name : '-'}</div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {order.unit_type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-sans text-base font-semibold">{order.block}-{order.floor}-{order.unit_no}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={order.include_partition ? 'text-green-600' : 'text-gray-400'}>
                                            {order.include_partition ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-semibold text-green-600">
                                            RM {(order.f_1 ? (order.latest_quotation.bonus ? (order.final_amount - Number(order.latest_quotation.bonus.value)) : order.final_amount) : order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">{order.created_by ? order.created_by.name : '-'}</div>
                                            <div className="text-xs text-gray-500">{order.created_at}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">{order.updated_by ? order.updated_by.name : '-'}</div>
                                            <div className="text-xs text-gray-500">{order.updated_at}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-around gap-2">
                                            <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                                                <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                                                    <i className="ki-filled ki-dots-vertical"></i>
                                                </button>

                                                <div className="dropdown-content menu menu-default w-full max-w-64 py-2" data-dropdown-dismiss="true">
                                                    {order.user &&
                                                        <div className="menu-item">
                                                            <button
                                                                className="menu-link copy-link"
                                                                data-clipboard-text={`${CLIENT_URL}order/overview/id/${order.id}`}
                                                            >
                                                                <span className="menu-title">
                                                                    <div className="flex gap-2 items-center">
                                                                        <i className="ki-outline ki-copy"></i>
                                                                        <span className="text-gray-900">
                                                                            Copy Quotation Order Link
                                                                        </span>
                                                                    </div>
                                                                </span>
                                                            </button>
                                                        </div>
                                                    }

                                                    {order.status === 'unreleased' && order.user &&
                                                        <div className="menu-item">
                                                            <button
                                                                className="menu-link"
                                                                onClick={() => handleReleaseOrder(Number(order.id))}
                                                            >
                                                                <span className="menu-title">
                                                                    <div className="flex gap-2 items-center">
                                                                        <i className="ki-outline ki-check-circle"></i>
                                                                        <span>Release Order</span>
                                                                    </div>
                                                                </span>
                                                            </button>
                                                        </div>
                                                    }
                                                    {order.status === 'released' &&
                                                        <>
                                                            <div className="menu-item">
                                                                <button
                                                                    className="menu-link"
                                                                    data-modal-toggle="#confirm_order_modal"
                                                                    onClick={() => setSelectedOrder({ id: order.id, name: order.order_no })}
                                                                >
                                                                    <span className="menu-title">
                                                                        <div className="flex gap-2 items-center text-success">
                                                                            <i className="ki-outline ki-check-circle"></i>
                                                                            <span>Confirm Order</span>
                                                                        </div>
                                                                    </span>
                                                                </button>
                                                            </div>
                                                            <div className="menu-item">
                                                                <button
                                                                    className="menu-link"
                                                                    data-modal-toggle="#void_quotation_modal"
                                                                    onClick={() => setSelectedOrder({ id: order.id, name: order.order_no })}
                                                                >
                                                                    <span className="menu-title">
                                                                        <div className="flex gap-2 items-center">
                                                                            <i className="ki-outline ki-cross-circle"></i>
                                                                            <span>Void Order</span>
                                                                        </div>
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    }
                                                    <div className="menu-item">
                                                        <Link
                                                            to={LOCAL_PATH_PREFIX + `orders/create?dp=${order.id}`}
                                                            className="menu-link"
                                                            target="_blank"
                                                        >
                                                            <span className="menu-title">
                                                                <div className="flex gap-2 items-center">
                                                                    <i className="ki-outline ki-save-2"></i>
                                                                    <span>Duplicate Order</span>
                                                                </div>
                                                            </span>
                                                        </Link>
                                                    </div>
                                                    {order.status !== 'confirmed' &&
                                                        <>
                                                            <div className="menu-item">
                                                                <Link
                                                                    to={LOCAL_PATH_PREFIX + `orders/edit/${order.id}`}
                                                                    className="menu-link"
                                                                >
                                                                    <span className="menu-title">
                                                                        <div className="flex gap-2 items-center">
                                                                            <i className="ki-outline ki-notepad-edit"></i>
                                                                            <span>Edit Order</span>
                                                                        </div>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div className="menu-item">
                                                                <button
                                                                    className="menu-link"
                                                                    data-modal-toggle="#delete_item_modal"
                                                                    onClick={() => setSelectedOrder({ id: order.id, name: order.order_no })}
                                                                >
                                                                    <span className="menu-title">
                                                                        <div className="flex gap-2 items-center text-danger">
                                                                            <i className="ki-outline ki-trash"></i>
                                                                            <span>Delete Order</span>
                                                                        </div>
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                    No orders available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!isLoading && orders.length > 0 && (
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

            {/* Click outside to close dropdowns */}
            {openDropdowns.length > 0 && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenDropdowns([])}
                />
            )}

            {/* Modals */}
            <ConfirmOrderModal
                order={selectedOrder}
                onSubmit={handleRefreshTable}
            />

            <VoidQuotationModal
                handleConfirm={handleVoidQuotation}
            />

            <DeleteModal
                item={selectedOrder}
                modalTitle='Remove Order'
                modalPrompt='Are you sure to permanently remove this order:'
                notifySuccess='Order Removed Successfully!'
                notifyError='Order remove failed'
                navigateUrl='/orders'
                deleteFunction={handleRemoveOrder}
            />
        </div>
    );
}

export default OrderMain;