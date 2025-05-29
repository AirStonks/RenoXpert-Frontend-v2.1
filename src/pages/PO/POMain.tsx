import ClipboardJS from "clipboard";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Slide, toast } from "react-toastify";
import { POIndex } from "../../services/api";
import { PurchaseOrder } from "../../types";
import Loading from "../../components/Loading";
import { useUser } from "../../context/UserContext";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

type SortOrder = 'asc' | 'desc' | null;

function POMain() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const { currentUser, loading } = useUser();
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type])(message, {
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
        document.title = "Purchase Orders | RenoXpert";
        initPOTable(1, 10, '', null, '');

        const clipboard = new ClipboardJS('.copy-link');
        clipboard.on('success', (e) => {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => clipboard.destroy();
    }, []);

    const initPOTable = async (page: number, size: number, searchTerm?: string, order?: string, field?: string) => {
        try {
            setIsLoading(true);
            const response = await POIndex(size, page, searchTerm, order, field);
            const newPOs = response?.data || [];
            setPurchaseOrders(newPOs);
            setTotalItems(response?.totalCount || 0);
            setExpandedCards(newPOs.reduce((acc: Record<string, boolean>, po: PurchaseOrder) => ({
                ...acc,
                [po.id]: true
            }), {}));
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            setError('Failed to load purchase orders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initPOTable(page, size, searchTerm, sortOrder, sortField);
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
                const response = await POIndex(size, 1, value, sortOrder, sortField);
                const newPOs = response?.data || [];
                setPurchaseOrders(newPOs);
                setTotalItems(response?.totalCount || 0);
                setExpandedCards(newPOs.reduce((acc: Record<string, boolean>, po: PurchaseOrder) => ({
                    ...acc,
                    [po.id]: true
                }), {}));
            } catch (error) {
                console.error('Error searching purchase orders:', error);
                setError('Failed to search purchase orders');
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initPOTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        initPOTable(1, newSize, searchTerm, sortOrder, sortField);
    };

    const toggleCard = (poId: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [poId]: !prev[poId]
        }));
    };

    const renderPOCard = (po: PurchaseOrder, index: number) => {
        const isExpanded = expandedCards[po.id] ?? true;
        const isOdd = index % 2 === 1;

        return (
            <div className="card mb-4" key={po.id}>
                <div
                    className={`card-header flex justify-between items-center cursor-pointer ${isOdd ? 'bg-gray-200' : ''}`}
                    onClick={() => toggleCard(po.id)}
                >
                    <div className="card-title">
                        <Link
                            to={LOCAL_PATH_PREFIX + `purchase-orders/${po.id}`}
                            className='link text-orange-500'
                            onClick={(e) => e.stopPropagation()}
                        >
                            #{po.po_no}
                        </Link>
                        - RM {po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                    {currentUser && currentUser.type !== 'backend-vendor' && (
                                        <th className="w-[100px]">Sales No.</th>
                                    )}
                                    <th className="w-[100px]">Owner</th>
                                    <th className="w-[60px] text-center">Unit</th>
                                    <th className="w-[60px] text-center">Property</th>
                                    <th className="w-[100px]">Vendor</th>
                                    <th className="w-[60px]">Total Amount</th>
                                    <th className="w-[120px] text-center">Order Status</th>
                                    <th className="w-[80px] text-center">Payment Status</th>
                                    <th className="w-[80px] text-center">Delivery/Fulfillment</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="odd:bg-gray-100">
                                    {currentUser && currentUser.type !== 'backend-vendor' && (
                                        <td>
                                            {po.sale ? (
                                                <Link
                                                    to={LOCAL_PATH_PREFIX + `sales/${po.sale_id}`}
                                                    state={{ fromUrl: LOCAL_PATH_PREFIX + 'purchase-orders' }}
                                                    className="text-orange-500"
                                                >
                                                    {po.sale.sales_no}
                                                </Link>
                                            ) : '-'}
                                        </td>
                                    )}
                                    <td>
                                        {po.sale ? (
                                            <div className="flex flex-col gap-1">
                                                <span>{po.sale.order.user.name}</span>
                                                <span className="text-xs text-slate-400">{po.sale.order.user.email}</span>
                                                <span className="text-xs text-slate-700">+{po.sale.order.user.country_code} {po.sale.order.user.phone_no}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="text-center">
                                        {po.sale ? `${po.sale.order.block}-${po.sale.order.floor}-${po.sale.order.unit_no}` : '-'}
                                    </td>
                                    <td className="text-center">
                                        {po.sale ? (
                                            <div className="flex flex-col gap-1">
                                                <span>{po.sale.order.property ? po.sale.order.property.name : '-'}</span>
                                                <div className="badge">
                                                    <span className="text-xs text-gray-900">{po.sale.order.unit_type}</span>
                                                </div>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {po.vendor ? (
                                            <div className="flex flex-col gap-1">
                                                <span>{po.vendor.name}</span>
                                                <span className="text-xs text-slate-400">{po.vendor.email}</span>
                                                <span className="text-xs text-slate-700">+{po.vendor.country_code} {po.vendor.phone_no}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        RM {po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="text-center">
                                        <span className={`badge badge-pill p-2 cursor-default capitalize
                                            ${po.order_status === 'released' ? 'badge-primary' : ''} 
                                            ${po.order_status === 'accepted' ? 'badge-success' : ''} 
                                            ${po.order_status === 'rejected' ? 'badge-danger' : ''} 
                                            badge-outline`}
                                        >
                                            {po.order_status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className={`badge badge-pill p-2 cursor-default capitalize
                                            ${po.payment_status === 'confirmed' ? 'badge-success' : ''} 
                                            ${po.payment_status === 'revoked' ? 'badge-danger' : ''} 
                                            badge-outline`}
                                        >
                                            {po.payment_status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <Link
                                            to={LOCAL_PATH_PREFIX + `purchase-orders/fulfillment/${po.id}`}
                                            className="btn btn-sm btn-outline btn-primary"
                                        >
                                            View Status
                                        </Link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const totalPages = Math.ceil(totalItems / size);

    return (
        <>
            {(isLoading || loading) && <Loading />}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">Purchase Orders</span>
                    {currentUser && currentUser.type !== 'backend-vendor' && (
                        <Link
                            to={LOCAL_PATH_PREFIX + 'purchase-orders/create'}
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#create_order_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            Create PO
                        </Link>
                    )}
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">Purchase Orders Overview</div>
                        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                            <button className="btn-refresh" onClick={handleRefreshTable}>
                                <i className="ki-solid ki-arrows-circle text-lg"></i>
                            </button>
                            <div className="flex">
                                <label className="input input-sm">
                                    <i className="ki-filled ki-magnifier"></i>
                                    <input
                                        placeholder="Search purchase orders..."
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        {purchaseOrders.length > 0 ? (
                            purchaseOrders.map((po, index) => renderPOCard(po, index))
                        ) : (
                            <div className="text-center text-gray-500 p-4">
                                No purchase orders available
                            </div>
                        )}
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

export default POMain;