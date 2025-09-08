import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchPO from "../../hook/useFetchPO";
import { useEffect, useRef, useState } from "react";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { POItem, POPackage, PurchaseOrder } from "../../types";
import { useUser } from "../../context/UserContext";
import ConfirmationModal from "./components/ConfirmationModal";
import { acceptPO, rejectPO, releasePO, revertPO } from "../../services/api";
import { Slide, toast } from "react-toastify";
import { KTModal } from "../../metronic/core";
import {
    ArrowLeft,
    MoreVertical,
    FileText,
    User,
    Building2,
    Package,
    Check,
    Eye,
    RotateCcw,
    Printer,
    X
} from "lucide-react";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

interface AccordionState {
    [key: string]: boolean;
}

// Extended interface for PurchaseOrder with sale property
interface ExtendedPurchaseOrder extends PurchaseOrder {
    sale?: {
        sales_no?: string;
        status?: string;
        total_amount?: number;
        order?: {
            user?: {
                name?: string;
                email?: string;
                phone_no?: string;
            };
        };
    };
}

// PO Package Display Component (Read-only version of SortablePOPackage)
const POPackageDisplay: React.FC<{
    poPackage: POPackage;
    openAccordions: { [key: string]: boolean };
    toggleAccordion: (packageId: string) => void;
}> = ({ poPackage, openAccordions, toggleAccordion }) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
            <div
                className="p-4 cursor-pointer bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
                onClick={() => toggleAccordion(poPackage.package_id)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <i className="ki-solid ki-package text-blue-600 text-lg"></i>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                    {poPackage.name}
                                </h4>
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                                    {poPackage.category?.replace("_", " ") || "Package"}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{poPackage.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-500">{poPackage.po_items.length} items</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-lg font-semibold">RM {poPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <button
                            onClick={() => toggleAccordion(poPackage.package_id)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                        >
                            <i className={`ki-solid ${openAccordions[poPackage.package_id] ? 'ki-chevron-down' : 'ki-chevron-right'} text-gray-500 text-lg`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {openAccordions[poPackage.package_id] && (
                <div className="border-t border-gray-200/50">
                    <div className="p-4">
                        <div className="grid grid-cols-11 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 px-2">
                            <div className="col-span-4">Item Details</div>
                            <div className="col-span-1 text-center">BASE QTY</div>
                            <div className="col-span-1 text-center">SUPPLY QTY</div>
                            <div className="col-span-1 text-center">INSTALL QTY</div>
                            <div className="col-span-1 text-right">Supply Total</div>
                            <div className="col-span-1 text-right">Install Total</div>
                            <div className="col-span-1 text-right">Item Total</div>
                            <div className="col-span-1"></div>
                        </div>
                        <div className="space-y-2">
                            {poPackage.po_items.map((poProd: POItem) => (
                                <div
                                    key={poProd.product_id}
                                    className="grid grid-cols-11 gap-2 items-center rounded-xl p-3 border transition-all duration-200 bg-white border-gray-200/50 hover:shadow-sm"
                                >
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                Item
                                            </span>
                                        </div>
                                        <h5 className="font-medium text-gray-900 text-sm mb-1 leading-tight">
                                            {poProd.product_name}
                                        </h5>
                                        <div className="space-y-0.5 text-xs text-gray-500">
                                            <span>{poProd.product_desc || "-"}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        <span className="w-8 text-center text-sm font-medium">
                                            {poProd.qty || 0}
                                        </span>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        <span className="w-8 text-center text-sm font-medium">
                                            {poProd.supply_qty || 0}
                                        </span>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        <span className="w-8 text-center text-sm font-medium">
                                            {poProd.install_qty || 0}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                            RM{" "}
                                            {(
                                                (poProd.supply_price || 0) *
                                                (poProd.supply_qty || 0)
                                            ).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {poProd.supply_qty || 0} × RM {(poProd.supply_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                            RM{" "}
                                            {(
                                                (poProd.install_price || 0) *
                                                (poProd.install_qty || 0)
                                            ).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {poProd.install_qty || 0} × RM {(poProd.install_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <div className="text-lg font-semibold text-blue-600">
                                            RM{" "}
                                            {(
                                                ((poProd.supply_price || 0) * (poProd.supply_qty || 0)) +
                                                ((poProd.install_price || 0) * (poProd.install_qty || 0))
                                            ).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">Total</div>
                                    </div>
                                    <div className="col-span-1"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function PODetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { poDetail, loading, error, refetch } = useFetchPO(poId);
    const extendedPoDetail = poDetail as ExtendedPurchaseOrder;
    const { currentUser, loading: userLoading } = useUser();
    const [openAccordions, setOpenAccordions] = useState<AccordionState>({});

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            // navigate(LOCAL_PATH_PREFIX + 'purchase-orders');
            navigate(LOCAL_PATH_PREFIX + 'reno-sales/' + poDetail.reno_sale_id);
        }
    };

    useEffect(() => {
        document.title = 'Purchase Order Detail | RenoXpert';
    }, []);

    const handleReleasePo = async () => {
        try {
            const response = await releasePO(Number(poDetail.id));

            if (response?.success) {
                refetch();

                const modalEl = document.querySelector('#po_release_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                modal.hide();

                notify('success', "PO Released Successfully!");
            }

        } catch (error) {
            notify('error', 'Error occurred during PO release.');
        }
    }

    const handleAcceptPo = async () => {
        try {
            const response = await acceptPO(Number(poDetail.id));

            if (response?.success) {
                refetch();

                const modalEl = document.querySelector('#po_accept_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                console.log(modal);


                modal.hide();

                notify('success', "PO Accepted Successfully!");
            }

        } catch (error) {
            notify('error', 'Error occurred during PO acceptance.');
        }
    }

    const handleRejectPo = async () => {
        try {
            const response = await rejectPO(Number(poDetail.id));

            if (response?.success) {
                refetch();

                const modalEl = document.querySelector('#po_reject_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();

                notify('success', "PO Rejected Successfully!");
            }

        } catch (error) {
            notify('error', 'Error occurred during PO rejection.');
        }
    }

    const handleRevertPo = async () => {
        try {
            const response = await revertPO(Number(poDetail.id));

            if (response?.success) {
                refetch();

                const modalEl = document.querySelector('#po_revert_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();

                notify('success', "PO Reverted Successfully!");
            }

        } catch (error) {
            notify('error', 'Error occurred during PO revert.');
        }
    }

    const toggleAccordion = (packageId: string) => {
        setOpenAccordions(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'released':
                return 'bg-blue-100 text-blue-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'unreleased':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'issued':
                return 'bg-blue-100 text-blue-800';
            case 'partial-paid':
                return 'bg-yellow-100 text-yellow-800';
            case 'fully-paid':
                return 'bg-green-100 text-green-800';
            case 'unpaid':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!poId) return null;

    if (loading || userLoading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!poDetail) {
        return <div>Purchase Order not found</div>;
    }

    return (
        <>
            {/* Header */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200/50 px-6 py-4 mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <button
                            className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-all duration-200 active:scale-95"
                            onClick={handleBackClick}
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 -tracking-wide">Purchase Order Detail</h1>
                                <p className="text-sm text-gray-500 mt-1">PO #{poDetail.po_no}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {currentUser.type !== 'backend-vendor' ?
                            <>
                                {poDetail.order_status === 'released' ?
                                    <Link
                                        to={LOCAL_PATH_PREFIX + 'purchase-orders/' + poId + '/invoices'}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Invoices
                                    </Link>
                                    :
                                    <>
                                        <Link
                                            to={LOCAL_PATH_PREFIX + 'purchase-orders/edit/' + poId}
                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Edit PO
                                        </Link>
                                        <button
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                            data-modal-toggle="#po_release_modal"
                                        >
                                            <Check className="h-4 w-4" />
                                            Release PO
                                        </button>
                                    </>
                                }
                            </>
                            :
                            poDetail.order_status === 'released' &&
                            <>
                                <button
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                    data-modal-toggle="#po_accept_modal"
                                >
                                    <Check className="h-4 w-4" />
                                    Accept PO
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                    data-modal-toggle="#po_reject_modal"
                                >
                                    <X className="h-4 w-4" />
                                    Reject PO
                                </button>
                            </>
                        }

                        <div className="relative" ref={dropdownRef}>
                            <button
                                ref={buttonRef}
                                onClick={toggleDropdown}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                            >
                                <MoreVertical className="h-4 w-4" />
                                More
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="py-1">
                                        <Link
                                            to={LOCAL_PATH_PREFIX + 'purchase-orders/' + poId + '/print'}
                                            target="_blank"
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <Printer className="h-4 w-4" />
                                            Print PO
                                        </Link>
                                        {poDetail.order_status === 'accepted' && (
                                            <button
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                data-modal-toggle="#po_revert_modal"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Revert to Unreleased
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full mx-auto px-6 pb-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column - General Info */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* General Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">General</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">PO No:</span>
                                        <span className="text-sm font-medium text-gray-900">{poDetail.po_no}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(poDetail.order_status)}`}>
                                            {poDetail.order_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Date:</span>
                                        <span className="text-sm font-medium text-gray-900">{poDetail.created_at}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Amount:</span>
                                        <span className="text-sm font-medium text-gray-900">RM {poDetail.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vendor Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Building2 className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Vendor</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Vendor Name:</span>
                                        <span className="text-sm font-medium text-gray-900">{poDetail.vendor?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <span className="text-sm font-medium text-gray-900">{poDetail.vendor?.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Phone No.:</span>
                                        <span className="text-sm font-medium text-gray-900">+{poDetail.vendor?.country_code} {poDetail.vendor?.phone_no}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sale Order Card */}
                        {extendedPoDetail.sale && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <FileText className="h-5 w-5 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Sale Order</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sales No:</span>
                                            <span className="text-sm font-medium text-gray-900">{extendedPoDetail.sale.sales_no}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(extendedPoDetail.sale.status || '')}`}>
                                                {extendedPoDetail.sale.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Amount:</span>
                                            <span className="text-sm font-medium text-gray-900">RM {extendedPoDetail.sale.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Owner Card */}
                        {extendedPoDetail.sale?.order?.user && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <User className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Owner</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Name:</span>
                                            <span className="text-sm font-medium text-gray-900">{extendedPoDetail.sale.order.user.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="text-sm font-medium text-gray-900">{extendedPoDetail.sale.order.user.email}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Phone No.:</span>
                                            <span className="text-sm font-medium text-gray-900">{extendedPoDetail.sale.order.user.phone_no}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Summary & Packages */}
                    <div className="xl:col-span-9 space-y-6">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Package className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">PO Items</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col gap-4">
                                    {poDetail.po_packages.map((poPackage: POPackage) => (
                                        <POPackageDisplay
                                            key={poPackage.package_id}
                                            poPackage={poPackage}
                                            openAccordions={openAccordions}
                                            toggleAccordion={toggleAccordion}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                modalId="po_release_modal"
                modalTitle="Release PO"
                modalPrompt="Are you sure you want to release this PO?"
                modalItemName={poDetail.po_no}
                submitBtnClass="btn-success"
                submitBtnText="Release"
                handleSubmit={handleReleasePo}
            />

            <ConfirmationModal
                modalId="po_accept_modal"
                modalTitle="Accept PO"
                modalPrompt="Are you sure you want to accept this PO?"
                modalItemName={poDetail.po_no}
                submitBtnClass="btn-success"
                submitBtnText="Accept"
                handleSubmit={handleAcceptPo}
            />

            <ConfirmationModal
                modalId="po_reject_modal"
                modalTitle="Reject PO"
                modalPrompt="Are you sure you want to reject this PO?"
                modalItemName={poDetail.po_no}
                submitBtnClass="btn-danger"
                submitBtnText="Reject"
                handleSubmit={handleRejectPo}
            />

            <ConfirmationModal
                modalId="po_revert_modal"
                modalTitle="Revert PO"
                modalPrompt="Are you sure you want to revert this PO to unreleased?"
                modalItemName={poDetail.po_no}
                submitBtnClass="btn-success"
                submitBtnText="Confirm"
                handleSubmit={handleRevertPo}
            />
        </>
    )
}

export default PODetail;