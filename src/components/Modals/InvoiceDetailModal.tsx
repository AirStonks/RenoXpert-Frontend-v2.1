// src\components\Modals\InvoiceDetailModal.tsx

import useFetchInvoice from "../../hook/useFetchInvoice";
import Loading from "../Loading";

interface InvoiceDetailModalProps {
    invoiceId: number | null;
}

function InvoiceDetailModal({ invoiceId }: InvoiceDetailModalProps) {
    const { invoiceDetail, loading, error } = useFetchInvoice(invoiceId);

    let content;

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!invoiceDetail) {
        content = <div>Invoice not found</div>;
    } else {
        const discounts = JSON.parse(JSON.parse(JSON.stringify(invoiceDetail.discountsData)));
        console.log(discounts);


        content = (
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
                                    Invoice No:
                                </td>
                                <td className="text-sm text-gray-900 pb-3">
                                    {invoiceDetail.invoice_no}
                                </td>
                            </tr>
                            <tr>
                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                    Amount:
                                </td>
                                <td className="text-sm text-gray-900 pb-3">
                                    {`RM ${invoiceDetail.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </td>
                            </tr>
                            <tr>
                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                    Discounts:
                                </td>
                                <td className="text-sm text-gray-900 pb-3">
                                    {discounts.length > 0 ? (
                                        discounts.map((discount, index) => {
                                            const discountValue = discount.valueType === "percentage"
                                                ? `${(discount.value * 100).toFixed(2)}%`
                                                : `RM ${discount.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                                            return (
                                                <div key={index}>
                                                    {discountValue}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <span>No Discounts</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                    Payment Link:
                                </td>
                                <td className="text-sm text-gray-900 pb-3">
                                    <a href="#" className="link">
                                        http://www.payex.io?paymentId=876817283654526
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="modal p-14" data-modal="true" id="payment_invoice_modal">
            <div className="modal-content modal-center-y max-w-[1024px] h-[580px] max-h-[580px]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Payment Invoice Detail</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross"></i>
                    </button>
                </div>
                <div className="modal-body">
                    {content}
                </div>
            </div>
        </div>
    );
}

export default InvoiceDetailModal;