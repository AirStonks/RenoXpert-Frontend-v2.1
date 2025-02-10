// src\pages\Order\OrderMain.tsx

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderIndex, releaseOrder, removeOrder } from '../../services/api';
import DeleteModal from '../../components/Modals/DeleteModal';
import Loading from '../../components/Loading';
import { Order } from '../../types';
import { Slide, toast } from 'react-toastify';
import ClipboardJS from 'clipboard';
import ConfirmOrderModal from './components/ConfirmOrderModal';

const APP_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_APP_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_APP_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_APP_URL
                : null;

type SortOrder = 'asc' | 'desc' | null;

function OrderMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [orders, setOrders] = useState<Order[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

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
        initOrderTable(1, 10, '', null, '');

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        // Cleanup the ClipboardJS instance
        return () => {
            clipboard.destroy();
        };

    }, []);

    const initOrderTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await orderIndex(size, page, searchTerm, order, field);

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
        initOrderTable(page, size, searchTerm, sortOrder, sortField);
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
                const response = await orderIndex(size, 1, value, sortOrder, sortField);

                const data = response?.data || [];
                setOrders(data);
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
        initOrderTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initOrderTable(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
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
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initOrderTable(page, size, searchTerm, 'asc', field);
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
    }

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Quotation Orders
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <Link
                            to={'/orders/create'}
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#create_order_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            Add New Quotation Order
                        </Link>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Quotation Orders Overview
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
                                        placeholder="Search packages"
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
                                    <th className='w-[120px]'>Order No.</th>
                                    <th className='w-[100px] text-center'>Status</th>
                                    <th className='w-[220px] text-center'>Internal Remark</th>
                                    <th className='w-[120px] text-center'>Owner</th>
                                    <th className='w-[60px] text-center'>Unit</th>
                                    <th className='w-[60px] text-center'>Property</th>
                                    <th className='w-[20px] text-center'>Partition</th>
                                    <th className='w-[100px] text-center'>Price</th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Created Date {getSortIcon('created_at')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('updated_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Updated Date {getSortIcon('updated_at')}
                                        </div>
                                    </th>
                                    <th className='w-[100px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((order, orderIndex) => (
                                        <tr
                                            key={orderIndex}
                                            className={`${orderIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <Link
                                                        to={`/orders/${order.id}`}
                                                        className="cursor-pointer text-orange-500"
                                                    >
                                                        {order.order_no}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <span className={`badge badge-pill p-2 cursor-default capitalize
                                                    ${order.status === 'released' ? 'badge-primary' : ''} 
                                                    ${order.status === 'confirmed' ? 'badge-success' : ''} 
                                                    ${order.status === 'revoked' ? 'badge-danger' : ''} 
                                                    ${order.user == null ? 'badge-warning' : ''} 
                                                    badge-outline`}
                                                >
                                                    {order.user ? (order.status === 'confirmed' ? 'sale' : order.status) : 'Draft'}
                                                </span>
                                            </td>
                                            <td className=''>
                                                {order.internal_remark ? order.internal_remark : '-'}
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    {order.user ?
                                                        <>
                                                            <span>{order.user.name}</span>
                                                            <span className="text-xs text-slate-400">{order.user.email}</span>
                                                            <span className="text-xs text-slate-700">+60 {order.user.phone_no}</span>
                                                        </>
                                                        :
                                                        '-'
                                                    }
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>{order.block}-{order.floor}-{order.unit_no}</span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>{order.property ? order.property.name : '-'}</span>
                                                    <div className="badge">
                                                        <span className="text-xs text-gray-900">{order.unit_type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>{order.include_partition ? 'Yes' : 'No'}</span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col gap-1">
                                                    <span>RM {order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col">
                                                    <span>{order.created_by ? order.created_by.name : '-'}</span>
                                                    <div className="inline-block">
                                                        <span className="text-sm font-semibold badge badge-outline badge-sm my-1">{order.created_at}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col">
                                                    <span>{order.updated_by ? order.updated_by.name : '-'}</span>
                                                    <div className="inline-block">
                                                        <span className="text-sm font-semibold badge badge-outline badge-sm my-1">{order.updated_at}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
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
                                                                        data-clipboard-text={`${APP_URL}owner/order/overview/id/${order.id}`}
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
                                                            }
                                                            <div className="menu-item">
                                                                <Link
                                                                    to={`/orders/create?dp=${order.id}`}
                                                                    className="menu-link"
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
                                                                            to={`/orders/edit/${order.id}`}
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
                                        <td colSpan={9} className="text-center text-gray-500">
                                            No orders available
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
            </div>

            <ConfirmOrderModal
                order={selectedOrder}
                onSubmit={handleRefreshTable}
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
        </>
    );
}

export default OrderMain;
