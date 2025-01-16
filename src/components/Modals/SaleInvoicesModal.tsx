// src\components\Modals\OrderDetailModal.tsx

import { useEffect } from "react";
import Loading from "../Loading";
import { KTAccordion, KTModal } from "../../metronic/core";
import { OrderQuotation, Package } from "../../types";
import { Link } from "react-router-dom";
import useFetchOrder from "../../hook/useFetchOrder";

interface QuotationDetailModalProps {
    orderId: number | null;
}

function SaleInvoicesModal({ orderId }: QuotationDetailModalProps) {
    const { orderDetail, loading, error } = useFetchOrder(orderId);

    useEffect(() => {
        KTAccordion.init();

        if (orderDetail) {
            // console.log(JSON.parse(JSON.stringify(orderDetail.latest_quotation)));

            // selectedQuotation = JSON.parse(JSON.stringify(orderDetail.latest_quotation));
            // setSelectedPackages(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata)));
        }

    }, [orderDetail]);

    if (!orderId) return null; // Early return for null orderId

    const handleCloseModal = () => {
        const modalEl = document.querySelector('#sale_invoices_modal') as HTMLElement;
        const modal = KTModal.getInstance(modalEl);

        modal.hide();
    }

    let content;

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!orderDetail) {
        content = <div>Order not found</div>;
    } else {

        console.log(orderDetail);


        const selectedQuotation = JSON.parse(JSON.stringify(orderDetail.latest_quotation)) as OrderQuotation;
        const selectedPackages = JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata))) as Package[];

        console.log(selectedQuotation);


        content = (
            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>

                            <Link
                                to={`/orders/edit/${orderId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={orderId}
                                onClick={handleCloseModal}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Order No:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.order_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Amount:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${orderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className={`badge badge-sm p-2 cursor-default
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' ? 'badge-danger' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Contact
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
                                            {orderDetail.user.phone_no}
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
                                            {orderDetail.property.address}, {orderDetail.property.street}, {orderDetail.property.postcode}, {orderDetail.property.city}, {orderDetail.property.state}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[6] gap-8'>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Quotation
                            </h3>

                            <Link
                                to={`/orders/edit/${orderId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={orderId}
                                onClick={handleCloseModal}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>

                        {selectedQuotation && (
                            <div className="flex flex-col gap-4">
                                <div className="card">
                                    <div className="card-body quotation-info flex justify-between items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className='text-lg font-semibold text-gray-900'>
                                                {selectedQuotation.quotation.name}
                                            </span>
                                            <span className="text-base font-normal text-gray-800">
                                                Price: RM {selectedQuotation.quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-base font-normal text-slate-400">
                                                {selectedQuotation.quotation.description}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-body">
                                        <div className="text-base font-semibold text-gray-900 mb-2">
                                            Packages:
                                        </div>
                                        <div className="flex flex-col gap-5" data-accordion="true">
                                            {selectedPackages.map((prodPackage: Package) => (
                                                <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                                    <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                                        <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-base text-gray-900 font-medium">
                                                                    {prodPackage.name}
                                                                </span>
                                                                <span className='text-base text-gray-700'>
                                                                    RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                                <span className='text-sm text-slate-400'>
                                                                    {prodPackage.description}
                                                                </span>
                                                            </div>
                                                            <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                            <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                        </button>
                                                        <div className="accordion-content hidden border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                            <div className="product-list flex flex-col">
                                                                <table className="table align-middle text-gray-700 font-medium text-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className='w-[150px]'>Product</th>
                                                                            <th className='w-[100px] text-center'>Quantity</th>
                                                                            <th className='w-[100px]'>Unit Price</th>
                                                                            <th className='w-[100px]'>Total Price</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {prodPackage.products.map((product) => (
                                                                            <tr
                                                                                key={product.id}
                                                                            >
                                                                                <td>
                                                                                    <div className="flex flex-col">
                                                                                        <span>{product.name}</span>
                                                                                        <span className="text-xs text-slate-400">{product.description}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className='text-center text-lg'>
                                                                                    <span className="mx-2 text-base">
                                                                                        {product.pivot.quantity}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    RM {(product.provisioning.supply.retail_price) + (product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                </td>
                                                                                <td>
                                                                                    RM {((product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="modal p-14"
                data-modal="true"
                id="sale_invoices_modal"
                aria-modal="true"
                role="dialog"
            >
                <div className="modal-content modal-overlay">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Order Detail</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            aria-label="Close"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body p-5 scrollable">
                        {content}
                    </div>
                </div>
            </div>

            {/* <EditPackageModal orderDetail={orderDetail} /> */}
        </>
    );
}

export default SaleInvoicesModal;