// src\components\Modals\PackageDetailModal.tsx

import React, { useEffect, useState } from "react";
import Loading from "../Loading";
import EditPackageModal from "./EditPackageModal";
import { KTAccordion, KTModal } from "../../metronic/core";
import useFetchQuotation from "../../hook/useFetchQuotation";
import { Package } from "../../types";
import { Link } from "react-router-dom";

interface QuotationDetailModalProps {
    quotationId: number | null;
    onClose: () => void; // Add this prop
}

function QuotationDetailModal({ quotationId, onClose }: QuotationDetailModalProps) {
    const { quotationDetail, loading, error } = useFetchQuotation(quotationId);
    const [selectedPackages, setSelectedPackages] = useState([]);

    useEffect(() => {
        KTAccordion.init();

        if (quotationDetail) {
            setSelectedPackages(JSON.parse(JSON.stringify(quotationDetail.metadata)));
        }
        
    }, [quotationDetail]);

    if (!quotationId) return null; // Early return for null quotationId

    const handleCloseModal = () => {
        const modalEl = document.querySelector('#quotation_detail_modal') as HTMLElement;
        const modal = KTModal.getInstance(modalEl);

        modal.hide();
    }

    let content;

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!quotationDetail) {
        content = <div>Quotation not found</div>;
    } else {

        content = (
            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>

                            <Link
                                to={`/quotations/edit/${quotationId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={quotationId}
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
                                            Quotation Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {quotationDetail.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Price:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${quotationDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className="badge badge-sm badge-success badge-outline">
                                                Available
                                            </span>
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
                                Packages
                            </h3>

                            <Link
                                to={`/quotations/edit/${quotationId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={quotationId}
                                onClick={handleCloseModal}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>

                        <div className="flex flex-col gap-5 p-4" data-accordion="true">
                            {selectedPackages.map((prodPackage: Package) => (
                                <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                    <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                        <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                            <div className="flex flex-col items-start">
                                                <span className="text-base text-gray-900 font-medium">
                                                    {prodPackage.name}
                                                </span>
                                                {/* <span className='text-base text-slate-700'>
                                                    RM {prodPackage.total_price.toFixed(2)}
                                                </span> */}
                                                <span className='text-sm text-slate-400'>
                                                    {prodPackage.description}
                                                </span>
                                            </div>
                                            <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block">
                                            </i>
                                            <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden">
                                            </i>
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
                                                        {prodPackage.products.map((product: any) => (
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
                                                                    RM {product.price.toFixed(2)}
                                                                </td>
                                                                <td>
                                                                    RM {(product.price * product.pivot.quantity).toFixed(2)}
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
        );

        // const modalEl = document.querySelector('#quotation_detail_modal') as HTMLElement;
        // const modal = KTModal.getInstance(modalEl);

        // modal.on('hide', (detail) => {
        //     // detail.cancel = true;
        //     console.log('layer 1');

        //     handleClose();
        // });

        // const handleClose = () => {
        //     onClose(); // Call the passed function to reset quotationId
        // }
    }

    return (
        <>
            <div
                className="modal p-14"
                data-modal="true"
                id="quotation_detail_modal"
                aria-modal="true"
                role="dialog"
            >
                <div className="modal-content modal-center-y max-w-[1024px] h-[580px] max-h-[580px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Package Detail</span>
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

            {/* <EditPackageModal quotationDetail={quotationDetail} /> */}
        </>
    );
}

export default QuotationDetailModal;