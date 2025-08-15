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
    ChevronDown, 
    ChevronRight,
    Check,
    Eye,
    RotateCcw,
    Printer,
    X
} from "lucide-react";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

interface AccordionState {
    [key: number]: boolean;
}

// Extended interface for PurchaseOrder with sale property
interface ExtendedPurchaseOrder extends PurchaseOrder {
    sale?: {
        order?: {
            user?: {
                name?: string;
                email?: string;
                phone_no?: string;
            };
        };
    };
}

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
            navigate(LOCAL_PATH_PREFIX + 'purchase-orders');
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

    if (!poId) return null;

    if (loading || userLoading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!poDetail) {
        return <div>Purchase Order not found</div>;
    }

    const toggleAccordion = (packageId: number) => {
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
                                    Accept Order
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                    data-modal-toggle="#po_reject_modal"
                                >
                                    <X className="h-4 w-4" />
                                    Reject Order
                                </button>
                                <Link
                                    to={LOCAL_PATH_PREFIX + 'purchase-orders/' + poId + '/invoices'}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    Invoices
                                </Link>
                            </>
                        }

                        <div className="relative">
                            <button
                                ref={buttonRef}
                                className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-all duration-200 active:scale-95"
                                onClick={toggleDropdown}
                            >
                                <MoreVertical className="w-5 h-5 text-gray-700" />
                            </button>

                            {isDropdownOpen && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute right-0 mt-2 w-64 bg-white/95 border border-gray-200 backdrop-blur-xl rounded-2xl shadow-xl py-2 z-50"
                                >
                                    {currentUser.type !== 'backend-vendor' && poDetail.order_status !== 'unreleased' && poDetail.invoices.length < 1 &&
                                        <button
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50/80 transition-colors duration-200 flex items-center gap-3"
                                            data-modal-toggle="#po_revert_modal"
                                        >
                                            <RotateCcw className="h-4 w-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">Revert PO</span>
                                        </button>
                                    }
                                    <Link
                                        to={LOCAL_PATH_PREFIX + `purchase-orders/print/${poId}`}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50/80 transition-colors duration-200 flex items-center gap-3"
                                    >
                                        <Printer className="h-4 w-4 text-gray-600" />
                                        <span className="text-sm text-gray-700">Print PO</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full mx-auto px-6 pb-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column - Order Details */}
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
                                        <span className="text-sm text-gray-600">PO No.:</span>
                                        <span className="text-sm font-medium text-gray-900">{poDetail.po_no}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Created Date:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {poDetail.created_at
                                                ? new Date(poDetail.created_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Order Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(poDetail.order_status)}`}>
                                            {poDetail.order_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Payment Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(poDetail.payment_status)}`}>
                                            {poDetail.payment_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Amount:</span>
                                        <span className="text-lg font-semibold text-gray-900">RM {poDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Owner Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <User className="h-5 w-5 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Owner</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Name:</span>
                                        <span className="text-sm font-medium text-gray-900">{extendedPoDetail?.sale?.order?.user?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <span className="text-sm font-medium text-gray-900">{extendedPoDetail?.sale?.order?.user?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Phone No.:</span>
                                        <span className="text-sm font-medium text-gray-900">{extendedPoDetail?.sale?.order?.user?.phone_no || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vendor Card */}
                        {poDetail.vendor_id && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Building2 className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Vendor</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Vendor Name:</span>
                                            <span className="text-sm font-medium text-gray-900">{poDetail.vendor.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="text-sm font-medium text-gray-900">{poDetail.vendor.email}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Phone No.:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {poDetail.vendor.country_code && poDetail.vendor.phone_no 
                                                    ? `+${poDetail.vendor.country_code} ${poDetail.vendor.phone_no}` 
                                                    : 'N/A'}
                                            </span>
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
                                    {poDetail.po_packages.map((poPackage: POPackage, index) => (
                                        <div
                                            key={index}
                                            className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Accordion Header */}
                                            <div
                                                className="flex items-center justify-between w-full p-5 hover:bg-gray-50/50 cursor-pointer transition-colors duration-200"
                                                onClick={() => toggleAccordion(index)}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="p-2 bg-orange-100 rounded-lg">
                                                        <Package className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-800 font-semibold text-sm">{poPackage.name}</span>
                                                        <span className="text-gray-600 font-medium text-sm">RM {(poPackage.total_price * (poPackage.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {/* Package Quantity Input */}
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="text"
                                                            className="w-12 px-2 py-1 text-center text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all duration-200 bg-gray-50"
                                                            value={poPackage.quantity || 1}
                                                            readOnly
                                                        />
                                                    </div>
                                                    {openAccordions[index] ? (
                                                        <ChevronDown className="w-5 h-5 text-gray-600 transition-transform duration-300 ease-in-out" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-gray-600 transition-transform duration-300 ease-in-out" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Accordion Content */}
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordions[index]
                                                    ? 'opacity-100 max-h-screen'
                                                    : 'max-h-0 opacity-0'
                                                    }`}
                                            >
                                                <div className="p-5 pt-0">
                                                    <div className="overflow-x-auto">
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
                                                            {poPackage.po_items.map((poProd: POItem, itemIndex) => (
                                                                <div
                                                                    key={itemIndex}
                                                                    className="grid grid-cols-11 gap-2 items-center bg-white rounded-xl p-3 border border-gray-200/50 hover:shadow-sm transition-all duration-200"
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
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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