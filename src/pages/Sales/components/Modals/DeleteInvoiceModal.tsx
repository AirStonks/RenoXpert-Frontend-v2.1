import React, { useState } from 'react'
import { Invoice } from '../../../../types';
import { Slide, toast } from 'react-toastify';
import { removeInvoice } from '../../../../services/api';
import { KTModal } from '../../../../metronic/core';
import Loading from '../../../../components/Loading';

interface DeleteInvoiceModalProps {
    invoice: Invoice;
    refetchSale: () => void;
}

function DeleteInvoiceModal({ invoice, refetchSale }: DeleteInvoiceModalProps) {
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

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            const response = await removeInvoice(Number(invoice.id));

            if (response?.success) {

                // Close modal
                const modalEl = document.querySelector('#delete_invoice_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();

                refetchSale();

                notify('success', "Invoice deleted successfully.");
            }

        } catch (error) {
            notify('error', "Failed to delete invoice.");
        }

        setIsLoading(false);
    }

    return (
        <>
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" data-modal-keyboard="false"
                id="delete_invoice_modal">
                <div className="modal-content modal-center-y max-w-xl max-h-[95%]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Delete Invoice</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-toggle="#payment_invoice_modal"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body pb-5 scrollable-y">
                        {invoice &&
                            <>
                                <h3 className="text-lg font-medium text-gray-900 text-center my-6">
                                    <i className="ki-solid ki-trash-square text-7xl text-red-500"></i>
                                </h3>

                                <div className="text-sm text-center text-gray-700 mb-2">
                                    Are you sure you want to delete this invoice?
                                </div>

                                <div className="text-sm text-center font-bold text-gray-700 mb-4">
                                    Invoice Number: {invoice.invoice_no}
                                </div>

                                <blockquote className="p-4 border-s-4 border-warning bg-warning-clarity rounded-md mb-6">
                                    <div className="flex gap-4">
                                        <div className="flex">
                                            <i className="ki-filled ki-information-4 text-xl text-warning"></i>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-warning-active font-semibold">
                                                    Sale status will not be updated
                                                </span>
                                                <span className="text-sm text-gray-800">
                                                    Sale status will remain the same after deleting this invoice to prevent duplication of the Reno Rrogress being generated.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </blockquote>

                                <div className="flex justify-center items-center gap-4">
                                    <button
                                        type="button"
                                        className="btn btn-light btn-active-light-primary me-2"
                                        data-modal-toggle="#payment_invoice_modal"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-danger"
                                        // disabled={isInvalidDetail}
                                        onClick={handleSubmit}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

export default DeleteInvoiceModal