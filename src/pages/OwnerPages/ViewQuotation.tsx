// src\pages\OwnerPages\ViewQuotation.tsx

import React, { useEffect } from "react"
import KTComponent from '../../metronic/core';
import { useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import useFetchPublicInvoice from "../../hook/useFetchPublicInvoice";
import { makePaymentIntent } from "../../services/api";
import { Package, Product } from "../../types";

function ViewQuotation() {
    // const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const invoiceId = id ? parseInt(id, 10) : null;

    const { invoiceDetail, loading, error } = useFetchPublicInvoice(invoiceId);

    useEffect(() => {
        KTComponent.init();
    });

    const handlePaymentIntent = async () => {
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

    const packages = JSON.parse(JSON.parse(JSON.stringify(invoiceDetail.sale.order.latest_quotation.metadata)));

    return (
        <main className="grow content pt-5" id="content" role="content">
            <div className="container-fluid relative" id="content_container">
                <div className="flex flex-col flex-wrap gap-6 pb-28 justify-center items-center">
                    <img className="default-logo min-h-[22px] h-[52px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>

                    <div className="card flex-auto w-full max-w-4xl">
                        <div className="card-header flex justify-between">
                            <span className="text-lg font-semibold">Invoice and Quotation</span>
                            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0">
                                <i className="ki-filled ki-printer"></i>
                            </button>
                        </div>
                        <div className="card-body pt-2">
                            <div className="tabs mb-5" data-tabs="true">
                                <button className="tab active" data-tab-toggle="#tab_1_1">
                                    Invoice Detail
                                </button>
                                <button className="tab" data-tab-toggle="#tab_1_2">
                                    Quotation
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
                                            <td className="text-sm text-gray-600 pe-4 lg:pe-8 font-semibold">
                                                Amount:
                                            </td>
                                            <td className="text-sm text-gray-900 font-medium">
                                                RM {invoiceDetail.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="hidden" id="tab_1_2">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-center hidden md:table-cell">No.</th>
                                                <th className="p-2 text-left">Description</th>
                                                <th className="p-2 text-center hidden md:table-cell">Quantity</th>
                                                <th className="p-2 text-center">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {packages.map((quotationPackage: Package, index: number) => (
                                                <React.Fragment key={index}>
                                                    <tr className="bg-slate-50 border-b">
                                                        <td className="p-2 text-center hidden text-xs md:table-cell">{index + 1}</td>
                                                        <td className="p-2 text-xs font-semibold">{quotationPackage.name}</td>
                                                        <td className="p-2 text-center hidden text-xs md:table-cell"></td>
                                                        <td className="p-2 text-center text-xs">
                                                            RM {quotationPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                    {quotationPackage.products.map((product: Product, prodIndex: number) => (
                                                        // Check if product.pivot.visibility is true
                                                        product.pivot.visibility ? (
                                                            <tr key={prodIndex} className="border-b text-xs">
                                                                <td className="p-2 hidden md:table-cell"></td>
                                                                <td className="p-2 ">
                                                                    {product.name}
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    {product.pivot.quantity}
                                                                </td>
                                                                <td className="p-2 text-center hidden md:table-cell">
                                                                    {!product.pivot.included
                                                                        ? `- RM ${product.product_excluded_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                        : null}
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            ""
                                                        )
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            <tr className="font-medium">
                                                <td className="p-2 hidden md:table-cell" colSpan={2}></td>
                                                <td className="p-2 text-center">Total:</td>
                                                <td className="p-2 text-center">
                                                    RM {invoiceDetail.sale.order.latest_quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2">
                    {invoiceDetail.status !== 'paid' && (
                        <button
                            className="btn btn-lg btn-primary rounded-3xl shadow-lg"
                            onClick={handlePaymentIntent}
                        >
                            Make Payment
                        </button>
                    )}
                </div>
            </div>
        </main>
    )
}

export default ViewQuotation