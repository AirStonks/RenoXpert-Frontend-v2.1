// src\components\Modals\InvoiceDetailModal.tsx
import { useEffect, useState } from "react";
import ClipboardJS from "clipboard";
import useFetchInvoice from "../../../../hook/useFetchInvoice";
import Loading from "../../../../components/Loading";
import { Slide, toast } from "react-toastify";
import { Invoice } from "../../../../types";
import DeleteInvoiceModal from "./DeleteInvoiceModal";
import { markInvoiceAsPaid } from "../../../../services/api";
import React from "react";
import { useUser } from "../../../../context/UserContext";

interface InvoiceDetailModalProps {
    invoiceId: number | null;
    refetchPo: () => void
    handleResetPoId: () => void
}

const APP_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_APP_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_APP_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_APP_URL
                : null;

function InvoiceDetailModal({ invoiceId, refetchPo, handleResetPoId }: InvoiceDetailModalProps) {
    const { invoiceDetail, loading, error, refetch } = useFetchInvoice(invoiceId);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [linkStatusLoading, setLinkStatusLoading] = useState(false);
    const { currentUser, loading: userLoading } = useUser();

    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

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
            const target = document.getElementById('clipboard_1_target') as HTMLInputElement;
            const button = document.getElementById('clipboard_1_button') as HTMLInputElement;

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

    // const handleChangeLinkStatus = async (newStatus: string) => {
    //     if (!invoice) return;

    //     setLinkStatusLoading(true); // Set loading state

    //     const response = await changeInvoiceLinkStatus(Number(invoice.id), newStatus);

    //     setLinkStatusLoading(false); // Reset loading state

    //     if (response?.success) {
    //         const updatedInvoice = { ...invoice, link_status: newStatus };
    //         setInvoice(updatedInvoice);
    //         notify('success', "Link Status Changed.");
    //     } else {
    //         notify('error', "Failed to change link status.");
    //     }
    // };

    const handleMarkAsPaid = async (invoiceId: number) => {
        try {
            const response = await markInvoiceAsPaid(invoiceId);

            if (response?.success) {
                notify('success', "Invoice marked as paid.");
                refetch();
            }

        } catch (error) {
            console.error('Error changing invoice link status:', error);
        }

        setLinkStatusLoading(false);
    };

    let content;

    if (loading || linkStatusLoading || userLoading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!invoice) {
        content = <div>Invoice not found</div>;
    } else {
        content = (
            <div className="flex flex-wrap gap-4">
                <div className="flex flex-col flex-[1] gap-4">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">General Info</h3>
                            <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                                <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                                    <i className="ki-filled ki-dots-vertical"></i>
                                </button>

                                <div className="dropdown-content menu menu-default w-full max-w-64 py-2" data-dropdown-dismiss="true">
                                    {currentUser.type !== 'backend-vendor' && (
                                        <>
                                            {invoice.status === "unpaid" && (
                                                <div className="menu-item">
                                                    <button
                                                        className="menu-link copy-link"
                                                        data-modal-toggle="#new_payment_detail_modal"
                                                        onClick={() => handleMarkAsPaid(Number(invoice.id))}
                                                    >
                                                        <span className="menu-title">
                                                            <div className="flex gap-2 items-center">
                                                                <i className="ki-outline ki-copy"></i>
                                                                <span className="text-gray-900">
                                                                    Mark as Paid
                                                                </span>
                                                            </div>
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="menu-item">
                                                <button
                                                    className="menu-link copy-link"
                                                    data-modal-toggle="#delete_invoice_modal"
                                                // onClick={() => handleMarkAsPaid(Number(invoice.id))}
                                                >
                                                    <span className="menu-title">
                                                        <div className="flex gap-2 items-center text-danger">
                                                            <i className="ki-outline ki-trash"></i>
                                                            <span className="">
                                                                Delete Invoice
                                                            </span>
                                                        </div>
                                                    </span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Invoice No:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">{invoice.invoice_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Initial Bill Amount:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">
                                            {`RM ${(invoice.po.total_amount * invoice.percentage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Weightage:</td>
                                        <td className="text-sm text-gray-900 font-medium pb-3">{(invoice.percentage * 100).toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Bill Amount:</td>
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
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* <div className="card">
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
                                                    value={`${APP_URL}invoice/${invoiceDetail.id}/view`}
                                                    onClick={() => { window.open(`${APP_URL}invoice/${invoiceDetail.id}/view`, '_blank'); }}
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
                    </div> */}
                </div>
                <div className="flex flex-col flex-auto gap-4">
                    <div className="flex gap-2">
                        <div className="card flex-1">
                            <div className="card-header flex justify-between items-center">
                                <h3 className="card-title">Discounts</h3>
                            </div>
                            {invoice.discountsData && Array.isArray(invoice.discountsData) && invoice.discountsData.length > 0 ? (
                                invoice.discountsData.map((discount, index) => (
                                    <div key={index} className="card-group">
                                        <table className="table-auto">
                                            <tbody>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">Name:</td>
                                                    <td className="text-sm text-gray-900 font-medium pb-3">{discount.name}</td>
                                                </tr>
                                                {discount.valueType === "percentage" &&
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">Rate:</td>
                                                        <td className="text-sm text-gray-900 font-medium pb-3">{(discount.value * 100).toFixed(2)}%</td>
                                                    </tr>
                                                }
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">Discount Amount:</td>
                                                    <td className="text-sm text-gray-900 font-medium pb-3">RM {discount.valueType === "percentage" ? ((invoice.po.total_amount * invoice.percentage) * discount.value).toFixed(2) : discount.value.toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            ) : (
                                <div className="card-group">
                                    <span className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">No discounts</span>
                                </div>
                            )}
                        </div>
                        <div className="card flex-1">
                            <div className="card-header flex justify-between items-center">
                                <h3 className="card-title">Fees</h3>
                            </div>
                            {invoice.feesData && Array.isArray(invoice.feesData) && invoice.feesData.length > 0 ? (
                                invoice.feesData.map((fee, index) => (
                                    <div key={index} className="card-group">
                                        <table className="table-auto">
                                            <tbody>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">Name:</td>
                                                    <td className="text-sm text-gray-900 font-medium pb-3">{fee.name}</td>
                                                </tr>
                                                {fee.valueType === "percentage" &&
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">Rate:</td>
                                                        <td className="text-sm text-gray-900 font-medium pb-3">{(fee.value * 100).toFixed(2)}%</td>
                                                    </tr>
                                                }
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">Fee Amount:</td>
                                                    <td className="text-sm text-gray-900 font-medium pb-3">RM {fee.valueType === "percentage" ? ((invoice.po.total_amount * invoice.percentage) * fee.value).toFixed(2) : fee.value.toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            ) : (
                                <div className="card-group">
                                    <span className="text-sm text-gray-600 pb-3 pe-2 lg:pe-4">No fees</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">Payment Transaction</h3>
                        </div>
                        <div className="card-body flex flex-col gap-2">
                            <div className="grid gap-5">
                                {invoice.payments.map((payment, index) => (
                                    <div className="flex justify-between gap-3" key={index}>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex items-center justify-center size-7.5 shrink-0 bg-gray-100 rounded-lg border border-gray-300">
                                                <i className="ki-filled ki-cheque text-base text-gray-600">
                                                </i>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span
                                                    className="text-2sm font-medium text-gray-900 cursor-pointer hover:text-primary mb-px"
                                                    data-modal-toggle="#payment_detail_modal"
                                                    onClick={() => setSelectedPaymentId(Number(payment.id))}
                                                >
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
            </div >
        );
    }

    return (
        <>
            <div className="modal p-14" data-modal="true" id="payment_invoice_modal">
                <div className="modal-content modal-center-y max-w-[1180px] h-[580px] max-h-[580px]">
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

            {/* <NewPaymentDetailModal
                invoiceId={invoiceId}
                refetchInvoice={() => refetch()}
                refetchSale={refetchSale}
            />

            <PaymentDetailModal
                invoiceId={invoiceId}
                paymentId={selectedPaymentId}
            /> */}

            <DeleteInvoiceModal
                invoice={invoice}
                refetchPo={refetchPo}
                handleResetPoId={handleResetPoId}
            />
        </>
    );
}

export default InvoiceDetailModal;