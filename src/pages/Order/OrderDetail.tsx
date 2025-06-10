// src\pages\Order\OrderDetailPage.tsx

import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import useFetchOrder from "../../hook/useFetchOrder";
import { KTAccordion, KTModal, KTTooltip } from "../../metronic/core";
import { OrderQuotation, Package, Product } from "../../types";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { releaseOrder, reReleaseOrder, updateOrderInternalRemark, voidOrder } from "../../services/api";
import ConfirmOrderModal from "./components/ConfirmOrderModal";
import ReReleaseOrderModal from "./components/ReReleaseOrderModal";
import VoidQuotationModal from "./components/VoidQuotationModal";
import OrderPreviewModal from "./components/OrderPreviewModal";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const CLIENT_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_CLIENT_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_CLIENT_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/owner/'
                : null;


// orderDetail.latest_quotation.packages.map((quotationPackage: Package, index: number) => ()
// 

const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
};

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "others", label: "Others" },
];

function OrderDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const { orderDetail, loading, error, refetch } = useFetchOrder(orderId);
    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number; cogs: number; quantity: number }[]>([]);
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0);

    const [isEditingInternalRemark, setIsEditingInternalRemark] = useState(false);
    const [editableInternalRemark, setEditableInternalRemark] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({});

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
        document.title = "Quotation Order Detail | RenoXpert";

        KTAccordion.init();
        KTTooltip.init();

        // if (orderDetail) {
        //     console.log(JSON.parse(JSON.stringify(orderDetail.total_amount)));
        // }

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, []);

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.packages) return;

        let addonCounter = 0; // To number each add-on uniquely

        const packages: Package[] = orderDetail.latest_quotation.packages;

        const categoryTotals = packages.reduce((acc, quotationPackage) => {
            let category;
            if (quotationPackage.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter} (${quotationPackage.name})`;
            } else {
                category = quotationPackage.category;
            }

            const categoryData = quotationPackage.products.reduce(
                (data, product) => {
                    // Calculate retail prices (existing logic)
                    let supplyPrice = 0;
                    if (product.pivot.includeSupply) {
                        supplyPrice = (product.provisioning.supply.retail_price * product.pivot.quantity) || 0;
                    } else {
                        supplyPrice = (product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price) || 0;
                    }

                    let installPrice = 0;
                    if (product.pivot.includeInstall) {
                        installPrice = (product.provisioning.install.retail_price * product.pivot.quantity) || 0;
                    } else {
                        installPrice = (product.provisioning.install.retail_price - product.provisioning.install.excluded_price) || 0;
                    }

                    // Calculate COGS
                    let supplyCogs = 0;
                    if (product.pivot.includeSupply) {
                        supplyCogs = (product.provisioning.supply.cogs * product.pivot.quantity) || 0;
                    }

                    let installCogs = 0;
                    if (product.pivot.includeInstall) {
                        installCogs = (product.provisioning.install.cogs * product.pivot.quantity) || 0;
                    }

                    return {
                        total_price: data.total_price + supplyPrice + installPrice,
                        cogs: data.cogs + supplyCogs + installCogs,
                    };
                },
                { total_price: 0, cogs: 0 }
            );

            const categoryTotalPrice = categoryData.total_price * (quotationPackage.quantity || 1);
            const categoryCogs = categoryData.cogs * (quotationPackage.quantity || 1);

            if (!(quotationPackage.is_addon === true && quotationPackage.is_addon_included === false)) {
                if (!acc[category]) {
                    acc[category] = { total_price: 0, cogs: 0, quantity: 0 };
                }
                acc[category].total_price += categoryTotalPrice;
                acc[category].cogs += categoryCogs;
                acc[category].quantity += quotationPackage.quantity;
            }

            return acc;
        }, {} as Record<string, { total_price: number; cogs: number; quantity: number }>);

        // Calculate filtered total_amount (based on total_price)
        const filteredTotalAmount = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0);

        // Calculate total COGS
        const filteredTotalCogs = Object.values(categoryTotals).reduce((sum, { cogs }) => sum + cogs, 0);

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, cogs, quantity }]) => ({
            category: category.startsWith('Add-on Option')
                ? category
                : categoryOptions.find(option => option.value === category)?.label || category,
            total_price,
            cogs,
            quantity,
        }));

        const sortedCategories = [
            ...categoriesArray.filter(item => !item.category.startsWith('Add-on Option')),
            ...categoriesArray.filter(item => item.category.startsWith('Add-on Option')),
        ];

        setPackageCategories(sortedCategories);

        if (orderDetail.latest_quotation.packages.length > 0) {
            KTAccordion.createInstances();
        }
    }, [orderDetail?.latest_quotation?.packages]);

    useEffect(() => {
        if (orderDetail) {
            const totalAmount = orderDetail.final_amount > 0 ? orderDetail.final_amount : orderDetail.latest_quotation.packages.reduce((total, pkg) => {
                // Skip if package is not an addon or not included
                if (pkg.is_addon === true && pkg.is_addon_included === false) {
                    return total;
                }

                // Use final_amount if available, otherwise use total_price
                return total + (pkg.total_price * (pkg.quantity || 1));
            }, 0);

            setTotalExcludedAddonAmount(totalAmount);
        }
    }, [orderDetail]);

    useEffect(() => {
        if (orderDetail) {
            setOpenAccordions(() => {
                const initialState: { [key: string]: boolean } = {};
                if (orderDetail) {
                    orderDetail.latest_quotation.packages.forEach((_, index) => {
                        initialState[`content_${index}`] = false;
                    });
                }
                return initialState;
            });

            setOpenAccordions((prev) => ({
                ...prev,
                property: false
            }));
        }
    }, [orderDetail]); // Empty dependency array to run only once on mount

    if (!orderId) return null; // Early return for null orderId


    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate(LOCAL_PATH_PREFIX + 'orders');
        }
    };

    const handleReleaseOrder = async () => {
        setIsLoading(true);
        try {
            const response = await releaseOrder(orderId);

            if (response?.success) {
                notify('success', 'Order released successfully!');
                refetch();
            }

        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleEditInternalRemark = () => {
        setEditableInternalRemark(orderDetail.internal_remark || '');
        setIsEditingInternalRemark(true);
    }

    const handleChangeInternalRemark = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditableInternalRemark(event.target.value);
    }

    const handleSaveInternalRemark = async () => {
        setIsLoading(true);

        try {
            const response = await updateOrderInternalRemark(orderId, editableInternalRemark);

            if (response?.success) {
                setIsEditingInternalRemark(false);
                refetch();
                notify('success', 'Internal remark updated!');
            }

        } catch (error) {
            console.error(error);
            notify('error', 'Error occurred while saving internal remark.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleReReleaseOrder = async () => {

        setIsLoading(true);

        try {
            const response = await reReleaseOrder(orderId);

            if (response?.success) {

                const modalEl = document.querySelector('#re_release_order_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();

                notify('success', 'Order re-released successfully!');
                refetch();
            }

        } catch (error) {
            notify('error', 'Failed to re-release order.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleVoidQuotation = async () => {
        setIsLoading(true);

        try {
            const response = await voidOrder(orderId);

            if (response?.success) {

                const modalEl = document.querySelector('#void_quotation_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();

                notify('success', 'Order voided successfully!');
                refetch();
            }

        } catch (error) {
            notify('error', 'Failed to re-release order.');
        } finally {
            setIsLoading(false);
        }
    }

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!orderDetail) return <div>Order not found</div>;


    // console.log(orderDetail);
    const selectedQuotation = orderDetail.latest_quotation;
    const selectedPackages = orderDetail.latest_quotation.packages;


    const calculateQuotationMargin = () => {
        // Calculate total retail price
        const totalRetailPrice = orderDetail.final_amount ? orderDetail.final_amount : selectedPackages.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return total;
            }

            const packageRetail = pkg.products.reduce((pkgTotal, product) => {
                let supplyPrice = 0;
                if (product.pivot.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price * product.pivot.quantity) || 0;
                } else {
                    supplyPrice = (product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price) || 0;
                }

                let installPrice = 0;
                if (product.pivot.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price * product.pivot.quantity) || 0;
                } else {
                    installPrice = (product.provisioning.install.retail_price - product.provisioning.install.excluded_price) || 0;
                }

                return pkgTotal + (supplyPrice + installPrice);
            }, 0);
            return total + (packageRetail * (pkg.quantity || 1));
        }, 0);

        const totalDiscountPrice = Number(selectedQuotation.bonus?.value || 0);

        // Calculate total COGS (Cost of Goods Sold)
        const totalCogs = selectedPackages.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return total;
            }

            const packageCogs = pkg.products.reduce((pkgTotal, product) => {
                const supplyCogs = product.pivot.includeSupply
                    ? product.provisioning.supply.cogs * product.pivot.quantity
                    : 0;
                const installCogs = product.pivot.includeInstall
                    ? product.provisioning.install.cogs * product.pivot.quantity
                    : 0;
                return pkgTotal + (supplyCogs + installCogs);
            }, 0);
            return total + (packageCogs * (pkg.quantity || 1));
        }, 0);

        // Calculate margin in amount
        const marginInAmount = totalRetailPrice - totalCogs;

        // Calculate margin in percentage
        const marginInPercentage = totalRetailPrice > 0
            ? (marginInAmount / totalRetailPrice) * 100
            : 0;

        return {
            totalCogs,
            marginInAmount,
            marginInPercentage
        };
    };

    const { totalCogs, marginInAmount, marginInPercentage } = calculateQuotationMargin();

    const discount = selectedQuotation.bonus ? Number(selectedQuotation.bonus.value) : 0;
    const nettAmount = totalExcludedAddonAmount - discount;
    const nettMargin = nettAmount - totalCogs;
    const nettMarginPercentage = nettAmount > 0 ? (nettMargin / nettAmount) * 100 : 0;

    return (
        <>
            {isLoading && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Quotation Order Detail
                    </span>
                </div>
                <div className="flex gap-3">
                    {orderDetail?.status === 'unreleased' && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleReleaseOrder}
                        >
                            Release Order
                        </button>
                    )}
                    {orderDetail?.status === 'released' &&
                        <button
                            className="btn btn-success btn-sm"
                            data-modal-toggle="#confirm_order_modal"
                        >
                            Confirm Order
                        </button>
                    }
                    {
                        orderDetail?.status === 'voided' &&
                        <button
                            className="btn btn-primary btn-sm"
                            data-modal-toggle="#re_release_order_modal"
                        >
                            Re-release Order
                        </button>
                    }
                    {orderDetail?.status !== 'confirmed' &&
                        <Link
                            to={LOCAL_PATH_PREFIX + `orders/edit/${orderId}`}
                            className="btn btn-sm btn-info"
                            data-tooltip="#edit_tooltip"
                            data-action="edit"
                            data-id={orderId}
                        >
                            <i className="ki-outline ki-notepad-edit"></i>
                            Edit Order Quotation
                        </Link>
                    }

                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-64 py-2" data-dropdown-dismiss="true">
                            {orderDetail.user &&
                                <div className="menu-item">
                                    <button
                                        className="menu-link copy-link"
                                        data-clipboard-text={`${CLIENT_URL}order/overview/id/${orderId}`}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <i className="ki-outline ki-copy text-lg"></i>
                                                <span className="text-gray-900">
                                                    Copy Quotation Order Link
                                                </span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            }
                            <div className="menu-item">
                                <Link
                                    to={LOCAL_PATH_PREFIX + `orders/create?dp=${orderId}`}
                                    className="menu-link"
                                    target="_blank"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-outline ki-save-2 text-lg"></i>
                                            <span className="text-gray-900">
                                                Duplicate Order
                                            </span>
                                        </div>
                                    </span>
                                </Link>
                            </div>
                            <div className="menu-item">
                                <button
                                    className="menu-link"
                                    data-modal-toggle="#preview_order_modal"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-phone text-lg"></i>
                                            <span>Preview in Owner View</span>
                                        </div>
                                    </span>
                                </button>
                            </div>
                            <div className="menu-item">
                                <Link
                                    to={LOCAL_PATH_PREFIX + `orders/print/${orderId}`}
                                    className="menu-link"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-file-down text-lg"></i>
                                            <span>Print Quotation</span>
                                        </div>
                                    </span>
                                </Link>
                                <Link
                                    to={LOCAL_PATH_PREFIX + `orders/print/${orderId}/internal`}
                                    className="menu-link"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-file-down text-lg"></i>
                                            <span>Internal Quotation PDF</span>
                                        </div>
                                    </span>
                                </Link>
                            </div>
                            {orderDetail?.status === 'released' &&
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                        data-modal-toggle="#void_quotation_modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center text-red-600">
                                                <i className="ki-filled ki-cross-square text-lg"></i>
                                                <span>Void Quotation</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex flex-col flex-[2] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Owner
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {orderDetail.user ?
                                        <>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Name:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.user.name}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Email:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.user.email}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Phone No.:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    +{orderDetail.user.country_code} {orderDetail.user.phone_no}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            N/A
                                        </td>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            QUO No:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.order_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Original Amount:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    {orderDetail.final_amount &&
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Final Amount:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                RM {(orderDetail.final_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    }
                                    {selectedQuotation.bonus &&
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Discount Amount:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                - RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    }
                                    {orderDetail.final_amount ?
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 flex items-center gap-1">
                                                <i data-tooltip="#final_pricing_tooltip" className="ki-filled ki-information-2 textlg text-warning mt-[1.5px]"></i>
                                                <span>Nett Amount:</span>
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                <span className="text-sm text-gray-900 pb-3">
                                                    RM {(orderDetail.final_amount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        </tr>
                                        :
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Nett Amount:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                <span className="text-sm text-gray-900 pb-3">
                                                    RM {(totalExcludedAddonAmount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>

                                            </td>
                                        </tr>
                                    }
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className={`badge badge-sm p-2 cursor-default capitalize
                                                ${orderDetail.status === 'released' ? 'badge-primary' : ''} 
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' || orderDetail.status === 'voided' ? 'badge-danger' : ''} 
                                                ${orderDetail.status === 'draft' ? 'badge-warning' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status === 'confirmed' ? 'sale' : orderDetail.status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Version:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.latest_quotation.version ?
                                                String.fromCharCode(64 + orderDetail.latest_quotation.version)
                                                : "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Quotation Released Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.released_at ? formatDate(orderDetail.released_at) : 'N/A'}
                                        </td>
                                    </tr>
                                    {orderDetail.status === 'confirmed' &&
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Quotation Agreed Date:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                {formatDate(orderDetail.confirmed_at)}
                                            </td>
                                        </tr>
                                    }
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Updated Date:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {formatDate(orderDetail.latest_quotation.created_at)}

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Updated by:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.latest_quotation.created_by.name}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Internal Remark
                            </h3>
                            <div className="flex">
                                {isEditingInternalRemark === false &&
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleEditInternalRemark}
                                    >
                                        Edit
                                    </button>
                                }
                            </div>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            {isEditingInternalRemark ?
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        className="textarea textarea-bordered w-full h-32"
                                        value={editableInternalRemark || ''}
                                        onChange={(e) => handleChangeInternalRemark(e)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setIsEditingInternalRemark(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={handleSaveInternalRemark}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                                :
                                orderDetail.internal_remark ?
                                    <span className="text-gray-900">{orderDetail.internal_remark}</span>
                                    :
                                    <span className="text-gray-600">N/A</span>
                            }
                        </div>
                    </div>

                    <div className="card bg-info-light">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Discount/Bonus
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {selectedQuotation.bonus ?
                                        <>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Description:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    <ul className='text-sm text-gray-900 list-inside'>
                                                        {selectedQuotation.bonus.description ?
                                                            selectedQuotation.bonus.description.split('\n').map((item, index) => (
                                                                <li key={index}>{item}</li>
                                                            ))
                                                            :
                                                            <li>No Details</li>
                                                        }
                                                    </ul>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Value:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                N/A
                                            </td>
                                        </tr>
                                    }

                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Property
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {orderDetail.property ?
                                        <>

                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-24">
                                                    Property Name:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.property ? orderDetail.property.name : 'N/A'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-12">
                                                    Unit:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-12">
                                                    Unit Type:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.unit_type ? orderDetail.unit_type : "-"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-12">
                                                    Address:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {[
                                                        orderDetail.property.address,
                                                        orderDetail.property.street,
                                                        orderDetail.property.postcode,
                                                        orderDetail.property.city,
                                                        orderDetail.property.state,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')
                                                    }
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Bedroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.bedroom_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Single Bedroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.single_bedroom_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Queen Bedroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.queen_bedroom_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Studio Room:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.studio_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Bathroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.bathroom_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Partition:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.include_partition ? 'Yes' : 'No'}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            N/A
                                        </td>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Reno Agreement Detail
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Completion Day(s):
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.completion_day} Working Days
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Payment Schedule:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.is_progressive_payment ? 'Progressive Payment' : 'Full Payment'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Revision History
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <div className="grid gap-2.5">
                                {orderDetail.order_quotations.length > 0 ?
                                    orderDetail.order_quotations.slice().reverse().map((orderQuotation: OrderQuotation, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
                                        >
                                            <div className="flex flex-col">
                                                <Link
                                                    to={LOCAL_PATH_PREFIX + `order/${orderDetail.id}/ver/${orderQuotation.version}`}
                                                    className="flex items-center flex-wrap gap-3.5 cursor-pointer text-orange-500 font-semibold text-sm">
                                                    {orderDetail.order_no}-{String.fromCharCode(64 + orderQuotation.version)}
                                                </Link>
                                                <span className="text-xs text-gray-500">
                                                    Updated At:
                                                    <span className="font-semibold ml-1">{orderQuotation.updated_at}</span>
                                                </span>
                                                <span className="text-xs text-gray-700">
                                                    Updated By:
                                                    <span className="font-semibold ml-1">{orderQuotation.created_by.name}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center flex-wrap gap-3.5">
                                                <button className="btn btn-outline btn-info btn-sm disabled">
                                                    Revise
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                    :
                                    <div className="text-sm text-gray-600">No Revision History on this Quotation Order</div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col flex-[6] gap-4'>
                    <div className="flex gap-4">
                        <div className="card w-full">
                            <div className="card-header flex justify-between items-center">
                                <h3 className="card-title">Summary Pricing</h3>
                            </div>
                            <div className="card-group pt-3.5 pb-3.5">
                                <table className="table-auto w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-sm text-gray-600 pb-3 text-left">Category</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">Total Price</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">COGS</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">Nett Margin</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">Margin %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packageCategories.map((category, index) => {
                                            const categoryMargin = category.total_price - category.cogs;
                                            const categoryMarginPercentage =
                                                category.total_price > 0 ? (categoryMargin / category.total_price) * 100 : 0;

                                            return (
                                                <tr key={index}>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">{category.category}</td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        RM {category.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        RM {categoryMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        {categoryMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Totals Row */}
                                        <tr className="border-t">
                                            <td className="text-sm text-gray-600 font-bold pt-3 pe-4 lg:pe-8">Total</td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {marginInAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                {marginInPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                            </td>
                                        </tr>
                                        {/* Bonus/Discount Row (if applicable) */}
                                        {selectedQuotation.bonus && (
                                            <tr>
                                                <td className="text-sm text-gray-600 pt-3 whitespace-nowrap">Bonus/Discount</td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                    - RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">-</td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                    - RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                    - {(marginInPercentage - nettMarginPercentage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                </td>
                                            </tr>
                                        )}
                                        {/* Nett Amount Row */}
                                        <tr>
                                            <td className="text-sm text-gray-600 font-bold pt-3 pe-4 lg:pe-8">Nett Amount</td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {nettAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {(totalCogs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {nettMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                {nettMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {selectedQuotation && (
                        <div className="card">
                            <div className="card-body">
                                <div className="text-base font-semibold text-gray-900 mb-2">
                                    Packages:
                                </div>
                                <div className="flex flex-col gap-5" data-accordion="true">
                                    {(() => {
                                        let packageCounter = 0;
                                        let addonCounter = 0;

                                        return selectedPackages.map((prodPackage: Package) => {
                                            const isAddon = prodPackage.is_addon;
                                            const counter = isAddon ? addonCounter++ : packageCounter++;
                                            const label = isAddon ? `ADD-ON OPTIONAL ${counter + 1}: \n${prodPackage.name}` : prodPackage.name;

                                            // Calculate totals for each column
                                            const totals = prodPackage.products.reduce(
                                                (acc, product) => {
                                                    if (!product.pivot.included) return acc;
                                                    const supplyRRP = product.pivot.includeSupply
                                                        ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                        : 0;
                                                    const installRRP = product.pivot.includeInstall
                                                        ? product.provisioning.install.retail_price * product.pivot.quantity
                                                        : 0;
                                                    const supplyCOGS = product.pivot.includeSupply
                                                        ? product.provisioning.supply.cogs * product.pivot.quantity
                                                        : 0;
                                                    const installCOGS = product.pivot.includeInstall
                                                        ? product.provisioning.install.cogs * product.pivot.quantity
                                                        : 0;

                                                    return {
                                                        supplyRRP: acc.supplyRRP + supplyRRP,
                                                        installRRP: acc.installRRP + installRRP,
                                                        totalRRP: acc.totalRRP + supplyRRP + installRRP,
                                                        supplyCOGS: acc.supplyCOGS + supplyCOGS,
                                                        installCOGS: acc.installCOGS + installCOGS,
                                                        totalCOGS: acc.totalCOGS + supplyCOGS + installCOGS,
                                                    };
                                                },
                                                {
                                                    supplyRRP: 0,
                                                    installRRP: 0,
                                                    totalRRP: 0,
                                                    supplyCOGS: 0,
                                                    installCOGS: 0,
                                                    totalCOGS: 0,
                                                }
                                            );

                                            // Calculate Margin % and Margin Amount
                                            const marginPercent =
                                                totals.totalRRP !== 0
                                                    ? (((totals.totalRRP - totals.totalCOGS) / totals.totalRRP) * 100).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }) + "%"
                                                    : totals.totalCOGS > 0
                                                        ? "-100.00%"
                                                        : "0.00%";
                                            const marginAmount = (totals.totalRRP - totals.totalCOGS).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            });

                                            return (
                                                <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                                    <div
                                                        className="accordion-item active border rounded-xl w-full"
                                                        data-accordion-item="true"
                                                        id={"package_item_" + prodPackage.id.toString()}
                                                    >
                                                        <button
                                                            className="accordion-toggle flex justify-between p-4"
                                                            data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-base text-gray-900 font-medium text-start">{label}</span>
                                                                <span className="text-sm text-gray-600 text-start">{prodPackage.description}</span>
                                                                <span className="text-base text-gray-700">
                                                                    RM{" "}
                                                                    {(prodPackage.total_price * (prodPackage.quantity ? prodPackage.quantity : 1)).toLocaleString(
                                                                        undefined,
                                                                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                                                    )}
                                                                </span>
                                                                {prodPackage.category && (
                                                                    <div className="badge text-sm">
                                                                        {categoryOptions.find((option) => option.value === prodPackage.category)?.label}
                                                                    </div>
                                                                )}
                                                                <span className="text-sm text-gray-600 font-medium text-start">
                                                                    {prodPackage.description_internal && (
                                                                        <div className="flex items-center gap-2">
                                                                            <i className="ki-filled ki-information-2 text-warning text-xl"></i>
                                                                            {prodPackage.description_internal}
                                                                        </div>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-8">
                                                                {prodPackage.is_addon && (
                                                                    <span className="text-gray-700 font-semibold py-2 px-4 bg-slate-200 rounded-md whitespace-nowrap">
                                                                        {`Add-on Included: ${prodPackage.is_addon_included ? "Yes" : "No"}`}
                                                                    </span>
                                                                )}
                                                                <span className="text-gray-600 font-semibold py-2 px-4 bg-gray-200 rounded-md whitespace-nowrap">
                                                                    Quantity: {prodPackage.quantity ? prodPackage.quantity : 1}
                                                                </span>
                                                                <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                                <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                            </div>
                                                        </button>
                                                        <div
                                                            className="accordion-content active border-t"
                                                            id={"package_content_" + prodPackage.id.toString()}
                                                        >
                                                            <div className="product-list flex flex-col">
                                                                <table className="table align-middle text-gray-700 text-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="w-[10px] text-center">Supply</th>
                                                                            <th className="w-[10px] text-center">Install</th>
                                                                            <th className="w-[10px] text-center">No.</th>
                                                                            <th className="w-[450px]">Product</th>
                                                                            <th className="w-[10px] text-center"></th>
                                                                            <th className="w-[160px] text-center">Supplier</th>
                                                                            <th className="w-[100px] text-center">Quantity</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Supply RRP</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Install RRP</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Total RRP</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Supply COGS</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Install COGS</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Total COGS</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Margin %</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Margin Amount</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {prodPackage.products.map((product, index) => (
                                                                            <tr
                                                                                key={product.id}
                                                                                className={`${!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                    ? "light:bg-orange-50 dark:bg-orange-950"
                                                                                    : ""
                                                                                    }`}
                                                                            >
                                                                                <td>
                                                                                    <span></span>
                                                                                    <div className="flex flex-col items-center">
                                                                                        <input
                                                                                            className="checkbox"
                                                                                            name="supply"
                                                                                            type="checkbox"
                                                                                            checked={!!product.pivot.includeSupply}
                                                                                            readOnly
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="flex flex-col items-center">
                                                                                        <input
                                                                                            className="checkbox"
                                                                                            name="install"
                                                                                            type="checkbox"
                                                                                            checked={!!product.pivot.includeInstall}
                                                                                            readOnly
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="text-center">
                                                                                    <span>{index + 1}</span>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="flex flex-col">
                                                                                        <span>{product.name}</span>
                                                                                        <span className="text-xs text-gray-500">
                                                                                            {(!product.description || product.description === "")
                                                                                                ? ""
                                                                                                : [
                                                                                                    product.pivot.includeSupply && "Supply",
                                                                                                    product.pivot.includeInstall && "Install",
                                                                                                ]
                                                                                                    .filter(Boolean)
                                                                                                    .join(" and ") + (product.description ? " " + product.description : "")}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="text-center">
                                                                                    {!product.pivot.visibility && <i className="ki-solid ki-eye-slash text-2xl"></i>}
                                                                                </td>
                                                                                <td className="text-center">
                                                                                    <span>{product.supplier_name ? product.supplier_name : "-"}</span>
                                                                                </td>
                                                                                <td className="text-center text-lg">
                                                                                    <span className="mx-2 text-base">
                                                                                        {product.pivot.included
                                                                                            ? !product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                                ? 0
                                                                                                : product.pivot.quantity
                                                                                            : "0"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeSupply &&
                                                                                        `RM ${product.provisioning.supply.retail_price.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeInstall &&
                                                                                        `RM ${product.provisioning.install.retail_price.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold text-success">
                                                                                    {!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                        ? null
                                                                                        : `RM ${(
                                                                                            (product.pivot.includeSupply
                                                                                                ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                                                : 0) +
                                                                                            (product.pivot.includeInstall
                                                                                                ? product.provisioning.install.retail_price * product.pivot.quantity
                                                                                                : 0)
                                                                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeSupply &&
                                                                                        `RM ${product.provisioning.supply.cogs.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeInstall &&
                                                                                        `RM ${product.provisioning.install.cogs.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold text-danger">
                                                                                    {!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                        ? null
                                                                                        : `RM ${(
                                                                                            (product.pivot.includeSupply
                                                                                                ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                : 0) +
                                                                                            (product.pivot.includeInstall
                                                                                                ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                : 0)
                                                                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold">
                                                                                    {product.pivot.included
                                                                                        ? (() => {
                                                                                            const totalRRP =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.retail_price * product.pivot.quantity
                                                                                                    : 0);
                                                                                            const totalCOGS =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                    : 0);
                                                                                            return product.pivot.includeSupply || product.pivot.includeInstall
                                                                                                ? totalRRP !== 0
                                                                                                    ? `${(((totalRRP - totalCOGS) / totalRRP) * 100).toLocaleString(undefined, {
                                                                                                        minimumFractionDigits: 2,
                                                                                                        maximumFractionDigits: 2,
                                                                                                    })}%`
                                                                                                    : totalCOGS > 0
                                                                                                        ? "-100.00%"
                                                                                                        : "0.00%"
                                                                                                : "";
                                                                                        })()
                                                                                        : ""}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold">
                                                                                    {product.pivot.included
                                                                                        ? (() => {
                                                                                            const totalRRP =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.retail_price * product.pivot.quantity
                                                                                                    : 0);
                                                                                            const totalCOGS =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                    : 0);
                                                                                            const marginAmount = totalRRP - totalCOGS;
                                                                                            return product.pivot.includeSupply || product.pivot.includeInstall
                                                                                                ? `RM ${marginAmount.toLocaleString(undefined, {
                                                                                                    minimumFractionDigits: 2,
                                                                                                    maximumFractionDigits: 2,
                                                                                                })}`
                                                                                                : "";
                                                                                        })()
                                                                                        : ""}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                    <tfoot>
                                                                        <tr className="bg-gray-500">
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td className="text-center py-3">
                                                                                <span className="text-lg font-bold">
                                                                                    Total
                                                                                </span>
                                                                            </td> {/* Added padding for better spacing */}
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.supplyRRP >= 0 &&
                                                                                        `RM ${totals.supplyRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.installRRP >= 0 &&
                                                                                        `RM ${totals.installRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-success font-extrabold highlight-total"> {/* Added font-extrabold for emphasis */}
                                                                                <span className="text-sm font-bold text-success">
                                                                                    {totals.totalRRP >= 0 &&
                                                                                        `RM ${totals.totalRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.supplyCOGS >= 0 &&
                                                                                        `RM ${totals.supplyCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.installCOGS >= 0 &&
                                                                                        `RM ${totals.installCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-danger font-extrabold highlight-total-cogs"> {/* Added font-extrabold for emphasis */}
                                                                                <span className="text-sm font-bold text-danger">
                                                                                    {totals.totalCOGS >= 0 &&
                                                                                        `RM ${totals.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm font-bold">
                                                                                    {marginPercent}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm font-bold">
                                                                                    {`RM ${marginAmount}`}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <OrderPreviewModal
                orderDetail={orderDetail}
                selectedQuotation={selectedQuotation}
                packageCategories={packageCategories}
                formatDate={formatDate}
                totalExcludedAddonAmount={totalExcludedAddonAmount}
            />

            <ConfirmOrderModal
                order={{ id: orderDetail.id, name: orderDetail.order_no }}
                onSubmit={refetch}
            />

            <ReReleaseOrderModal
                handleConfirm={handleReReleaseOrder}
            />

            <VoidQuotationModal
                handleConfirm={handleVoidQuotation}
            />

            <div className="tooltip" id="final_pricing_tooltip">
                This is the price that will be display to the owner
            </div>
        </>
    )
}

export default OrderDetail;