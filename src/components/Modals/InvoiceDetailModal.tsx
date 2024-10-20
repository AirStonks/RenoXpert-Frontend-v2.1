// src\components\Modals\InvoiceDetailModal.tsx
import { useEffect, useState } from "react";
import ClipboardJS from "clipboard";
import useFetchInvoice from "../../hook/useFetchInvoice";
import Loading from "../Loading";
import { changeInvoiceLinkStatus } from "../../services/api";
import { Slide, toast } from "react-toastify";
import { Invoice } from "../../types";

interface InvoiceDetailModalProps {
    invoiceId: number | null;
}

function InvoiceDetailModal({ invoiceId }: InvoiceDetailModalProps) {
    const { invoiceDetail, loading, error } = useFetchInvoice(invoiceId);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [linkStatusLoading, setLinkStatusLoading] = useState(false);

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
        if (invoiceDetail) {
            setInvoice(invoiceDetail);
        }
    }, [invoiceDetail]);

    useEffect(() => {
        if (!loading && invoice) {
            const target = document.getElementById('clipboard_1_target');
            const button = document.getElementById('clipboard_1_button');

            if (!target || !button) {
                return;
            }

            const clipboard = new ClipboardJS(button, {
                target: () => target,
                text: () => target.value,
            });

            clipboard.on('success', function (e) {
                notify('success', 'Copied to clipboard!');
                e.clearSelection();
            });

            clipboard.on('error', function (e) {
                notify('error', 'Failed to copy to clipboard.');
            });

            // Cleanup to avoid memory leaks
            return () => {
                clipboard.destroy();
            };
        }
    }, [loading, invoice]);

    const handleChangeLinkStatus = async (newStatus: string) => {
        if (!invoice) return;

        setLinkStatusLoading(true); // Set loading state

        const response = await changeInvoiceLinkStatus(Number(invoice.id), newStatus);

        setLinkStatusLoading(false); // Reset loading state

        if (response?.success) {
            const updatedInvoice = { ...invoice, link_status: newStatus };
            setInvoice(updatedInvoice);
            notify('success', "Link Status Changed.");
        } else {
            notify('error', "Failed to change link status.");
        }
    };


    let content;

    if (loading || linkStatusLoading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!invoice) {
        content = <div>Invoice not found</div>;
    } else {
        // const discounts = JSON.parse(JSON.parse(JSON.stringify(invoiceDetail.discountsData)));
        console.log(invoiceDetail);
        

        content = (
            <div className="flex flex-wrap gap-4">
                <div className="flex flex-col flex-[2] gap-4">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">General Info</h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Invoice No:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">{invoice.invoice_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Amount:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">
                                            {`RM ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Due Date:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">
                                            {new Date(invoice.due_date).toLocaleDateString('en-GB')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Version:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">{invoice.version}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Status:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">
                                            <span className={`badge badge-pill badge-outline gap-1 items-center ${invoice.status === 'paid' ? 'badge-success' : ''}`}>
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                    {/* <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Discounts:</td>
                                        <td className="text-sm text-gray-900 pb-3 font-medium">
                                            {discounts.length > 0 ? (
                                                discounts.map((discount, index) => {
                                                    const discountValue = discount.valueType === "percentage"
                                                        ? `${(discount.value * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                                                        : `RM ${discount.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                                                    return <div key={index}>{discountValue}</div>;
                                                })
                                            ) : (
                                                <span>No Discounts</span>
                                            )}
                                        </td>
                                    </tr> */}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">Link Management</h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Link Status:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <select
                                                className="select select-sm max-w-24"
                                                value={invoice.link_status}
                                                onChange={(e) => handleChangeLinkStatus(e.target.value)} // Pass the new status here
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="deactivate">Deactivate</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Payment Link:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <div className="input w-auto">
                                                <input
                                                    className="w-auto cursor-pointer"
                                                    id="clipboard_1_target"
                                                    placeholder="Copy to clipboard"
                                                    type="text"
                                                    value={`http://${window.location.hostname}:5173/invoice/${invoiceDetail.id}/view`}
                                                    onClick={() => { window.open(`http://${window.location.hostname}:5173/invoice/${invoiceDetail.id}/view`, '_blank'); }}
                                                    readOnly
                                                />
                                                <button className="btn btn-icon" id="clipboard_1_button">
                                                    <i className="ki-outline ki-copy"></i>
                                                </button>
                                            </div>

                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col flex-auto gap-4">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">Payment Transaction</h3>
                        </div>
                        <div className="card-body flex flex-col gap-2">
                            <div className="grid gap-5">
                                {invoice.payments.map((payment) => (
                                    <div className="flex justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex items-center justify-center size-7.5 shrink-0 bg-gray-100 rounded-lg border border-gray-300">
                                                <i className="ki-filled ki-cheque text-base text-gray-600">
                                                </i>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-2sm font-medium text-gray-900 cursor-pointer hover:text-primary mb-px">
                                                    {payment.transaction_no}
                                                </span>
                                                <span className="text-2xs text-gray-700">
                                                    {payment.created_at
                                                        ? new Date(payment.created_at).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-sm text-gray-800">
                                                RM {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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