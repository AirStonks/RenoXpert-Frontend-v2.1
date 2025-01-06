// src\pages\Order\OrderDetailPage.tsx

import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import useFetchOrder from "../../hook/useFetchOrder";
import { KTAccordion } from "../../metronic/core";
import { OrderQuotation, Package, Product } from "../../types";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { releaseOrder } from "../../services/api";

function OrderDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const { orderDetail, loading, error, refetch } = useFetchOrder(orderId);

    const [activeTab, setActiveTab] = useState('tab_1_1');
    const [isLoading, setIsLoading] = useState(false);

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

    }, [orderDetail]);

    if (!orderId) return null; // Early return for null orderId

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/orders');
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

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!orderDetail) return <div>Order not found</div>;

    // console.log(orderDetail);
    const selectedQuotation = JSON.parse(JSON.stringify(orderDetail.latest_quotation)) as OrderQuotation;
    const selectedPackages = JSON.parse(JSON.stringify(orderDetail.latest_quotation.packages)) as Package[];

    const address = [
        orderDetail.user.address.address_1,
        orderDetail.user.address.street,
        orderDetail.user.address.postcode,
        orderDetail.user.address.city,
        orderDetail.user.address.state,
    ]
        .filter(Boolean)
        .join(', ');


    return (
        <>
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
                    <Link
                        to={`/orders/edit/${orderId}`}
                        className="btn btn-sm btn-info"
                        data-tooltip="#edit_tooltip"
                        data-action="edit"
                        data-id={orderId}
                    >
                        <i className="ki-outline ki-notepad-edit"></i>
                        Edit Order Quotation
                    </Link>

                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-56 py-2" data-dropdown-dismiss="true">
                            <div className="menu-item">
                                <button
                                    className="menu-link"
                                    data-modal-toggle="#preview_order_modal"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-phone"></i>
                                            <span>Preview in Owner View</span>
                                        </div>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
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
                                            {`RM ${orderDetail.latest_quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Amount:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <td className="text-sm text-gray-900 pb-3">
                                                RM {(selectedQuotation.total_amount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedQuotation.bonus && ` (Discount: RM${Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                                            </td>

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className={`badge badge-sm p-2 cursor-default
                                                ${orderDetail.status === 'released' ? 'badge-primary' : ''} 
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' ? 'badge-danger' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status}
                                            </span>
                                        </td>
                                    </tr>
                                    {/* <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Preview Link:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <button
                                                className="btn btn-outline btn-sm btn-primary disabled"
                                            >
                                                View Order Overview
                                            </button>
                                        </td>
                                    </tr> */}
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Version:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.latest_quotation.version ?
                                                String.fromCharCode(64 + orderDetail.latest_quotation.version)
                                                : "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Updated Date:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {new Date(orderDetail.latest_quotation.created_at).toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
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
                                                        {selectedQuotation.bonus.description.split('\n').map((item, index) => (
                                                            <li key={index}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Value:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {selectedQuotation.bonus.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <tr>
                                            -
                                        </tr>
                                    }

                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Owner
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
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
                                            +60 {orderDetail.user.phone_no}
                                        </td>
                                    </tr>
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
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Property Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.property.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Unit:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
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
                                            Total Bathroom:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.bathroom_count}
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
                                                    to={`ver/${orderQuotation.version}`}
                                                    className="flex items-center flex-wrap gap-3.5 cursor-pointer text-orange-500 font-semibold text-sm">
                                                    {orderDetail.order_no}-{String.fromCharCode(64 + orderQuotation.version)}
                                                </Link>
                                                <span className="text-xs text-gray-600">
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

                <div className='flex flex-col right-column flex-[6] gap-4'>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Quotation
                            </h3>
                        </div>

                        {selectedQuotation && (
                            <div className="card-body">
                                <div className="flex flex-col">
                                    <span className='text-lg font-semibold text-gray-900'>
                                        {selectedQuotation.quotation_name}
                                    </span>
                                    <span className="text-base font-normal text-gray-800">
                                        Price: RM {(selectedQuotation.total_amount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedQuotation.bonus && ` (Discount: RM${Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                                        }
                                    </span>
                                    <span className="text-base font-normal text-gray-400">
                                        {selectedQuotation.description}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedQuotation && (
                        <div className="card">
                            <div className="card-body">
                                <div className="text-base font-semibold text-gray-900 mb-2">
                                    Packages:
                                </div>
                                <div className="flex flex-col gap-5" data-accordion="true">
                                    {selectedPackages.map((prodPackage: Package) => (
                                        <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                            <div className="accordion-item active border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                                <button className="accordion-toggle flex justify-between p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {prodPackage.name}
                                                        </span>
                                                        <span className='text-base text-gray-700'>
                                                            RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className='text-sm text-gray-400'>
                                                            {prodPackage.description}
                                                        </span>
                                                    </div>
                                                    <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block">
                                                    </i>
                                                    <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden">
                                                    </i>
                                                </button>
                                                <div className="accordion-content active border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                    <div className="product-list flex flex-col">
                                                        <table className="table align-middle text-gray-700 font-medium text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className='w-[10px] text-center'>Supply</th>
                                                                    <th className='w-[10px] text-center'>Install</th>
                                                                    <th className='w-[250px]'>Product</th>
                                                                    <th className='w-[100px] text-center'>Quantity</th>
                                                                    <th className='w-[100px] text-center'>Unit Price</th>
                                                                    <th className='w-[100px] text-center'>Discount</th>
                                                                    <th className='w-[100px] text-center'>Total Price</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {prodPackage.products.map((product) => (
                                                                    <tr
                                                                        key={product.id}
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
                                                                        <td>
                                                                            <div className="flex flex-col">
                                                                                <span>{product.name}</span>
                                                                                <span className="text-xs text-gray-400">{product.description}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className='text-center text-lg'>
                                                                            <span className="mx-2 text-base">
                                                                                {product.pivot.included ? product.pivot.quantity : '0'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            {!product.pivot.includeSupply || !product.pivot.includeInstall
                                                                                ? `- RM ${(
                                                                                    (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0) +
                                                                                    (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                )
                                                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                : null}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {!product.pivot.included
                                                                                ? null
                                                                                : `RM ${(
                                                                                    (product.provisioning.supply.retail_price * product.pivot.quantity -
                                                                                        (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0)
                                                                                    ) +
                                                                                    (product.provisioning.install.retail_price * product.pivot.quantity -
                                                                                        (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                    )
                                                                                )
                                                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal p-4" data-modal="true" data-modal-backdrop-static="true" id="preview_order_modal">
                <div className="modal-content modal-overlay max-w-[420px]">
                    <div className="modal-header">
                        <div className="modal-title text-lg">
                            {orderDetail.status === 'confirmed' ?
                                <span className="">Quotation Order Overview (Preview)</span>
                                :
                                <span className="">Quotation Order Agreement (Preview)</span>
                            }
                        </div>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col ">
                        <div className="tabs mb-3">
                            <button
                                className={`tab ${activeTab === 'tab_1_1' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_1')}
                            >
                                {orderDetail.status === 'confirmed' ?
                                    'Overview'
                                    :
                                    'Quotation Order'
                                }
                            </button>
                            {orderDetail.status === 'confirmed' ?
                                <button
                                    className={`tab ${activeTab === 'tab_1_4' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tab_1_4')}
                                >
                                    Quotation Order
                                </button>
                                :
                                ''
                            }
                            <button
                                className={`tab ${activeTab === 'tab_1_2' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_2')}
                            >
                                T&C
                            </button>
                            <button
                                className={`tab ${activeTab === 'tab_1_3' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_3')}
                            >
                                Reno Agreement
                            </button>
                        </div>
                        <div className={activeTab === 'tab_1_1' ? '' : 'hidden'} id="tab_1_1">
                            <div className="overflow-x-auto">
                                {orderDetail.status === 'confirmed' &&
                                    <div className="flex flex-col flex-1 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg text-gray-900 mb-1 font-semibold">{100 - (orderDetail.sale.remaining_percentage * 100)}% Invoice Issued</span>
                                            <div className="flex">
                                                <div className="badge badge-success badge-outline text-md mb-2">
                                                    {orderDetail.sale.invoices.reduce((sum, invoice) => {
                                                        if (invoice.status === 'paid') {
                                                            return sum + invoice.percentage;
                                                        }
                                                        return sum;
                                                    }, 0) * 100}% Paid
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-[12px] mb-2 relative overflow-hidden">
                                            {/* Issued progress bar (outer) */}
                                            <div
                                                className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                style={{
                                                    width: `${100 - (orderDetail.sale.remaining_percentage * 100)}%`,
                                                    height: '12px'
                                                }}
                                            />

                                            {/* Paid progress bar (inner) */}
                                            <div
                                                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                style={{
                                                    width: `${orderDetail.sale.invoices.reduce((sum, invoice) => {
                                                        if (invoice.status === 'paid') {
                                                            return sum + invoice.percentage;
                                                        }
                                                        return sum;
                                                    }, 0) * 100}%`,
                                                    height: '12px'
                                                }}
                                            />
                                        </div>
                                        <div className="flex mb-2 gap-2">
                                            <span className="badge badge-pill badge-outline gap-1 items-center bg-blue-50 border-blue-200 text-blue-300">
                                                <span className="badge badge-dot size-1.5 bg-blue-300"></span>
                                                Issued
                                            </span>
                                            <span className="badge badge-pill badge-outline gap-1 items-center badge-success">
                                                <span className="badge badge-dot size-1.5 badge-success"></span>
                                                Paid
                                            </span>
                                        </div>
                                    </div>
                                }

                                <div className="flex flex-col mb-4">
                                    <div className="card flex-1 mb-2">
                                        <div className="card-header py-0 flex justify-between">
                                            <h2 className="card-title">
                                                Quotation Order Detail
                                            </h2>
                                            <span className={`badge badge-sm p-2 cursor-default
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' ? 'badge-danger' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <div className="flex justify-between flex-wrap gap-8 mb-4">
                                                <div className="flex flex-col">
                                                    {/* <span className='badge badge-sm text-sm text-gray-900 font-semibold'>{orderDetail.order_no}</span> */}
                                                    <span className='text-sm text-gray-600'>QUO Number:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>{orderDetail.order_no}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className='text-sm text-gray-600'>Date Created:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>
                                                        {new Date(orderDetail.created_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            {orderDetail.status === 'confirmed' &&
                                                <>
                                                    {
                                                        selectedQuotation.bonus && (
                                                            <div className="card-body p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg shadow-md mb-4">
                                                                <div className="flex flex-col gap-4">
                                                                    <div className="flex flex-col">
                                                                        <span className='text-lg text-teal-600 font-bold'>Bonus:</span> {/* Increased font size and boldness */}
                                                                        <ul className='text-sm text-gray-900 font-semibold list-inside pl-2 mt-2'>
                                                                            {selectedQuotation.bonus.description.split('\n').map((item, index) => (
                                                                                <li key={index} className="mb-1">
                                                                                    <span className="block light:bg-teal-100 dark:bg-teal-500 p-2 rounded-md shadow-sm">{item}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                    <div className="flex flex-col mt-4">
                                                                        <span className='text-sm text-gray-600 font-semibold'>Discount:</span>
                                                                        <span className='text-xl text-teal-600 font-bold'>
                                                                            {`RM ${selectedQuotation.bonus.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    {/* Total Amount section */}
                                                    <div className="card-body p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg shadow-md mb-4">
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex flex-col">
                                                                <span className='text-lg text-blue-600 font-bold'>Total Amount:</span> {/* Increased font size and boldness */}
                                                                <span className='text-xl text-gray-900 font-semibold'>
                                                                    {`RM ${orderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                </span>
                                                                {selectedQuotation.bonus && (
                                                                    <span className='text-gray-900 text-sm'>
                                                                        Original Price: {`RM ${orderDetail.latest_quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                        </div>
                                    </div>

                                    <div className="card flex-1 mb-2">
                                        <div className="card-header">
                                            <h2 className="card-title">
                                                Property
                                            </h2>
                                        </div>
                                        <div className="card-body">
                                            <div className="flex justify-between flex-wrap">
                                                <div className="flex flex-col mb-4 mr-8">
                                                    <span className='text-sm text-gray-600'>Name:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>{orderDetail.property.name}</span>
                                                </div>
                                                <div className="flex flex-col mb-4">
                                                    <span className='text-sm text-gray-600'>Unit:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>{orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}</span>
                                                </div>
                                                <div className="">

                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className='text-sm text-gray-600'>Address:</span>
                                                <span className='text-sm text-gray-900'>
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
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {orderDetail.status === 'confirmed' ?
                                    <>
                                        <div className="flex flex-col gap-2 mb-4">
                                            <span className="flex text-gray-900 text-lg font-semibold">
                                                Payment Invoices
                                            </span>

                                            {orderDetail.sale.invoices.length === 0 ?
                                                <div className="flex flex-col items-center">
                                                    <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                                                    <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />

                                                    <h2 className="text-xl font-semibold text-gray-900">There is no Payment Invoices here</h2>
                                                </div>
                                                : orderDetail.sale.invoices.map((invoice, index) => (
                                                    <div
                                                        key={index}
                                                        className="card cursor-pointer"
                                                        data-modal-toggle="#payment_invoice_modal"
                                                    // onClick={() => setSelectedInvoiceId(Number(invoice.id))}
                                                    >
                                                        <div className="card-body flex justify-between items-center">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex">
                                                                        <div className="relative size-[50px] shrink-0 mr-8">
                                                                            <svg className="w-full h-full stroke-info-clarity fill-info-light" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="#EFF6FF">
                                                                                </path>
                                                                                <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                                                                </path>
                                                                            </svg>
                                                                            <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                                                <i className="ki-outline ki-document text-1.5xl ps-px text-info"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <h3 className="text-gray-900 text-sm font-medium">
                                                                                {invoice.invoice_no}
                                                                            </h3>
                                                                            <div className="flex flex-col mr-8 mb-2">
                                                                                <span className={`badge badge-outline 
                                                                                                            ${invoice.status === 'paid' ? 'badge-success' : ''}
                                                                                                            ${invoice.status === 'overdue' ? 'badge-danger' : ''}
                                                                                                        `}>
                                                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex mr-14 flex-wrap">
                                                                        <div className="flex flex-col mr-8 mb-2">
                                                                            <span className="text-xs text-gray-600">
                                                                                Amount:
                                                                            </span>
                                                                            <span className="text-sm text-gray-900 font-medium">
                                                                                RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs text-gray-600">
                                                                                Due Date:
                                                                            </span>
                                                                            <span className="text-sm text-gray-900 font-medium">
                                                                                {invoice.due_date
                                                                                    ? new Date(invoice.due_date).toLocaleDateString('en-GB', {
                                                                                        day: 'numeric',
                                                                                        month: 'long',
                                                                                        year: 'numeric'
                                                                                    })
                                                                                    : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </>
                                    :
                                    ''
                                }

                                {orderDetail.status === 'confirmed' ?
                                    ''
                                    :
                                    <>
                                        <table className="w-full border-collapse mb-6">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="p-2 text-center hidden md:table-cell">No.</th>
                                                    <th className="p-2 text-left">Description</th>
                                                    <th className="p-2 text-center">UOM</th>
                                                    <th className="p-2 text-center">QTY</th>
                                                    <th className="p-2 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderDetail.latest_quotation.packages.map((quotationPackage: Package, index: number) => (
                                                    <React.Fragment key={index}>
                                                        <tr className="bg-slate-50 border-b">
                                                            <td className="p-2 text-center hidden text-xs md:table-cell">{index + 1}</td>
                                                            <td className="p-2 text-xs font-semibold">{quotationPackage.name}</td>
                                                            <td className="p-2 text-center hidden text-xs md:table-cell"></td>
                                                            <td className="p-2 text-center text-xs"></td>
                                                            <td className="p-2 text-center text-xs"></td>
                                                        </tr>
                                                        {quotationPackage.products.map((product: Product, prodIndex: number) => (
                                                            // Check if product.pivot.visibility is true
                                                            product.pivot.visibility ? (
                                                                <tr key={prodIndex} className="border-b text-xs">
                                                                    <td className="p-2 hidden md:table-cell"></td>
                                                                    <td className="p-2 flex flex-col">
                                                                        <span className='text-gray-900'>{product.name}</span>
                                                                        <span className='text-gray-500 text-2xs'>{product.description}</span>
                                                                    </td>
                                                                    <td className="p-2 text-center text-gray-900">
                                                                        {product.uom}
                                                                    </td>
                                                                    <td className="p-2 text-center text-gray-900">
                                                                        {!product.pivot.included
                                                                            ? 0
                                                                            : product.pivot.quantity}
                                                                    </td>
                                                                    <td className="p-2 text-center hidden md:table-cell text-gray-900"></td>
                                                                </tr>
                                                            ) : (
                                                                ""
                                                            )
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>

                                        {
                                            selectedQuotation.bonus && (
                                                <div className="card-body p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg shadow-md mb-4">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex flex-col">
                                                            <span className='text-lg text-teal-600 font-bold'>Bonus:</span> {/* Increased font size and boldness */}
                                                            <ul className='text-sm text-gray-900 font-semibold list-inside pl-2 mt-2'>
                                                                {selectedQuotation.bonus.description.split('\n').map((item, index) => (
                                                                    <li key={index} className="mb-1">
                                                                        <span className="block light:bg-teal-100 dark:bg-teal-500 p-2 rounded-md shadow-sm">{item}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div className="flex flex-col mt-4">
                                                            <span className='text-sm text-gray-600 font-semibold'>Discount:</span>
                                                            <span className='text-xl text-teal-600 font-bold'>
                                                                {`RM ${selectedQuotation.bonus.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {/* Total Amount section */}
                                        <div className="card-body p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg shadow-md mb-4">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col">
                                                    <span className='text-lg text-blue-600 font-bold'>Total Amount:</span> {/* Increased font size and boldness */}
                                                    <span className='text-xl text-gray-900 font-semibold'>
                                                        {`RM ${orderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                    </span>
                                                    {selectedQuotation.bonus && (
                                                        <span className='text-gray-900 text-sm'>
                                                            Original Price: {`RM ${orderDetail.latest_quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start gap-4">
                                            <label className="form-label flex items-center gap-2 flex-wrap">
                                                <input
                                                    className="checkbox"
                                                    name="agree_tnc"
                                                    type="checkbox"
                                                    value="1"
                                                    checked={false}
                                                    readOnly
                                                />
                                                <span className="max-w-[80%]">
                                                    I have read and accept the <a href='#' className='link' onClick={() => setActiveTab('tab_1_2')}>Term and Condition</a>
                                                </span>
                                            </label>
                                            <label className="form-label flex items-center gap-2 flex-wrap">
                                                <input
                                                    className="checkbox"
                                                    name="agree_reno_agreement"
                                                    type="checkbox"
                                                    value="1"
                                                    checked={false}
                                                    readOnly
                                                />
                                                <span className="max-w-[80%]">I acknowledge I have agreed with the <a href='#' className='link' onClick={() => setActiveTab('tab_1_3')}>Reno Agreement</a></span>
                                            </label>
                                        </div>
                                    </>
                                }
                            </div>
                        </div>
                        <div className={activeTab === 'tab_1_4' ? '' : 'hidden'} id="tab_1_4">
                            {orderDetail.status === 'confirmed' ?
                                <>
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-sm text-center hidden md:table-cell">No.</th>
                                                <th className="p-2 text-sm text-left">Description</th>
                                                <th className="p-2 text-center">UOM</th>
                                                <th className="p-2 text-center">QTY</th>
                                                <th className="p-2 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderDetail.latest_quotation.packages.map((quotationPackage: Package, index: number) => (
                                                <React.Fragment key={index}>
                                                    <tr className="bg-slate-50 border-b text-2xs">
                                                        <td className="p-2 text-center hidden md:table-cell">{index + 1}</td>
                                                        <td className="p-2 font-semibold">{quotationPackage.name}</td>
                                                        <td className="p-2 text-center hidden md:table-cell"></td>
                                                        <td className="p-2 text-center"></td>
                                                        <td className="p-2 text-center"></td>
                                                    </tr>
                                                    {quotationPackage.products.map((product: Product, prodIndex: number) => (
                                                        // Check if product.pivot.visibility is true
                                                        product.pivot.visibility ? (
                                                            <tr key={prodIndex} className="border-b text-2xs">
                                                                <td className="p-2 hidden md:table-cell"></td>
                                                                <td className="p-2 flex flex-col">
                                                                    <span className='text-gray-900'>{product.name}</span>
                                                                    <span className='text-gray-500 text-2xs'>{product.description}</span>
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    {product.uom}
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    {!product.pivot.included
                                                                        ? 0
                                                                        : product.pivot.quantity}
                                                                </td>
                                                                <td className="p-2 text-center hidden md:table-cell"></td>
                                                            </tr>
                                                        ) : (
                                                            ""
                                                        )
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                                :
                                ''
                            }
                        </div>
                        <div className={activeTab === 'tab_1_2' ? '' : 'hidden'} id="tab_1_2">

                        </div>
                        <div className={activeTab === 'tab_1_3' ? '' : 'hidden'} id="tab_1_3">

                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default OrderDetail;