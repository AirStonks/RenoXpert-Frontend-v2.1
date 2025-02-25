import { useState, useEffect } from "react";
import { Slide, toast } from "react-toastify";
import { fetchInvoicePayment } from "../../../../services/api";
import { Attachment, Payment } from "../../../../types";
import { KTModal } from "../../../../metronic/core";
import Loading from "../../../../components/Loading";

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

interface PaymentDetailModalProps {
    invoiceId: number | null;
    paymentId: number | null;
}

function PaymentDetailModal({ invoiceId, paymentId }: PaymentDetailModalProps) {
    const [paymentDetail, setPaymentDetail] = useState<Payment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

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

    const fetchPayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetchInvoicePayment(invoiceId, paymentId);

            if (response?.success) {
                setPaymentDetail(response.data);
            }
        } catch (error) {
            console.error(error);
            notify('error', 'Failed to fetch payment details.');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (invoiceId && paymentId) {
            fetchPayment();
        }
    }, [invoiceId, paymentId]);

    useEffect(() => {
        // If modal closed, set payment detail to null
        const modalEl = document.getElementById('payment_detail_modal');
        const modal = KTModal.getInstance(modalEl);

        const handleModalHidden = () => {
            console.log('test');
            
            setPaymentDetail(null);
        };

        // Add event listener
        const eventId =modal.on('hide', handleModalHidden);

        // Cleanup function
        return () => {
            modal.off('hidden', eventId);
        };
    }, []); // Empty dependency array means this effect runs only once on mount and cleans up on unmount


    return (
        <>
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" data-modal-keyboard="false" id="payment_detail_modal">
                <div className="modal-content modal-center-y max-w-xl max-h-[95%]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Payment Detail</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-toggle="#payment_invoice_modal"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body pb-5 scrollable-y">
                        {paymentDetail ? (
                            <>
                                {/* Transaction No */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Transaction No.
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        {paymentDetail.transaction_no}
                                    </span>
                                </div>

                                {/* Payment Channel */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Payment Channel
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        {paymentDetail.payment_channel}
                                    </span>
                                </div>

                                {/* Payment Method */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Payment Method
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        {paymentDetail.payment_method}
                                    </span>
                                </div>

                                {/* Amount */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Amount
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        RM {paymentDetail.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {/* Payment Date */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Payment Date
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        {paymentDetail.payment_date}
                                    </span>
                                </div>

                                {/* Bank */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Bank
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        {paymentDetail.bank}
                                    </span>
                                </div>

                                {/* Receiving Account */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Receiving Account
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        {paymentDetail.receiving_account}
                                    </span>
                                </div>

                                {/* Remark */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Remark
                                    </label>
                                    <span className="text-sm text-gray-900">
                                        {paymentDetail.remark || '-'}
                                    </span>
                                </div>

                                {/* Attachments */}
                                {paymentDetail.attachments && paymentDetail.attachments.length > 0 && (
                                    <div className="flex flex-col mb-8">
                                        <label className='mb-2 text-sm font-medium text-gray-900'>
                                            Attachments
                                        </label>
                                        <div className="flex flex-col gap-4">
                                            {paymentDetail.attachments.map((attachment: Attachment, index) => (
                                                <div key={index} className="flex items-center justify-between flex-wrap grow border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 relative">
                                                    <div className="flex items-center flex-wrap gap-3.5">
                                                        <div className="relative size-[50px] shrink-0">
                                                            <svg
                                                                className="w-full h-full stroke-gray-300 fill-gray-100"
                                                                fill="none"
                                                                height="48"
                                                                viewBox="0 0 44 48"
                                                                width="44"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                                                                <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke=""></path>
                                                            </svg>
                                                            <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                                                                <i className="ki-filled ki-file text-xl text-gray-500"></i>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <a
                                                                className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                                href={AWS_S3_URL + (attachment.file_url)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {attachment.original_name}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-gray-500">
                                Loading payment details...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default PaymentDetailModal;