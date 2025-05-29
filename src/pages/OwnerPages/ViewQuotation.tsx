// src\pages\OwnerPages\ViewQuotation.tsx

import React, { useEffect } from "react"
import KTComponent from '../../metronic/core';
import { useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import useFetchPublicInvoice from "../../hook/useFetchPublicInvoice";
import { makePaymentIntent } from "../../services/api";
import { Link } from "react-router-dom";
import { Slide, toast } from "react-toastify";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

function ViewQuotation() {
    // const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const invoiceId = id ? parseInt(id, 10) : null;

    const { invoiceDetail, loading, error } = useFetchPublicInvoice(invoiceId);

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
        document.title = "Invoice | RenoXpert";
        KTComponent.init();
    });

    const handlePaymentIntent = async () => {

        // notify('error', 'Sorry, payment is currently under maintenance. Contact sale team to proceed payment.');
        // return;

        const response = await makePaymentIntent(Number(invoiceDetail.id));

        // Check if the response is successful
        if (response.status === "00" && response.result.length > 0) {
            // Get the url value from the first result
            const url = response.result[0].url;
            window.location.href = url;
        } else {
            console.error('Payment failed:', response.message);
        }
    };

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!invoiceDetail) return <div>An unexpected error occured</div>;

    if (invoiceDetail.link_status !== 'active') return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" data-datatable-spinner="true" >
            <div className="flex items-center text-lg rounded-md text-gray-500 bg-light">
                This invoice is inactive or expired.
            </div>
        </div>
    );

    return (
        <>
            <div className="card flex-auto w-full max-w-4xl">
                <div className="card-header flex justify-between">
                    <div className="flex gap-4 justify-center">
                        <Link
                            to={LOCAL_PATH_PREFIX + 'order/overview/id/' + invoiceDetail.sale.order_id}
                            className="ki-solid ki-arrow-left items-center">
                        </Link>
                        <span className="text-lg font-semibold">Payment Invoice</span>
                    </div>
                    {/* <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0">
                        <i className="ki-filled ki-printer"></i>
                    </button> */}
                </div>
                <div className="card-body pt-2">
                    <div className="tabs mb-5" data-tabs="true">
                        <button className="tab active" data-tab-toggle="#tab_1_1">
                            Invoice Detail
                        </button>
                    </div>
                    <div className="" id="tab_1_1">
                        <table className="table-auto">
                            <tbody>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Invoice No:
                                    </td>
                                    <td className="text-sm text-gray-900 font-medium pb-3">
                                        {invoiceDetail.invoice_no}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Order No:
                                    </td>
                                    <td className="text-sm text-gray-900 font-medium pb-3">
                                        {invoiceDetail.sale.order.order_no}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Issued Date:
                                    </td>
                                    <td className="text-sm text-gray-900 font-medium pb-3">
                                        {invoiceDetail.sale.order.created_at}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Status:
                                    </td>
                                    <td className="text-sm text-gray-900 font-medium pb-3">
                                        <span className={`badge badge-pill cursor-default badge-outline ${invoiceDetail.status === 'paid' ? 'badge-success' : ''}`}>
                                            {invoiceDetail.status.charAt(0).toUpperCase() + invoiceDetail.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Weightage:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3 font-medium">
                                        {(invoiceDetail.percentage * 100).toFixed(2)}%
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Amount:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3 font-medium">
                                        RM {invoiceDetail.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pe-4 lg:pe-8 font-semibold">
                                        Fees & Discounts:
                                    </td>
                                    <td className="text-sm text-gray-900 font-medium">
                                        <ul>
                                            {((invoiceDetail.discountsData && Array.isArray(invoiceDetail.discountsData) && invoiceDetail.discountsData.length > 0) ||
                                                (invoiceDetail.feesData && Array.isArray(invoiceDetail.feesData) && invoiceDetail.feesData.length > 0)) ? (
                                                <>
                                                    {invoiceDetail.discountsData && Array.isArray(invoiceDetail.discountsData) && invoiceDetail.discountsData.length > 0 ? (
                                                        invoiceDetail.discountsData.map((discount, index) => (
                                                            <li key={`discount-${index}`}>
                                                                {discount.name}
                                                            </li>
                                                        ))
                                                    ) : null}

                                                    {invoiceDetail.feesData && Array.isArray(invoiceDetail.feesData) && invoiceDetail.feesData.length > 0 ? (
                                                        invoiceDetail.feesData.map((fee, index) => (
                                                            <li key={`fee-${index}`}>
                                                                {fee.name}
                                                            </li>
                                                        ))
                                                    ) : null}
                                                </>
                                            ) : (
                                                <li>-</li>
                                            )}
                                        </ul>

                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
                {invoiceDetail.status !== 'paid' && (
                    <button
                        className="btn btn-lg btn-primary rounded-3xl shadow-lg opacity-50"
                        onClick={handlePaymentIntent}
                    >
                        Make Payment
                    </button>
                )}
            </div>
        </>
    )
}

export default ViewQuotation