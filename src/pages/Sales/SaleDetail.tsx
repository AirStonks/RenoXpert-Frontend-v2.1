// src\pages\Sales\SaleDetail.tsx

import { useNavigate, useParams } from "react-router-dom";
import useFetchSale from "../../hook/useFetchSale";
import Loading from "../../components/Loading";
import GenerateInvoiceModal from "../../components/Modals/GenerateInvoiceModal";
import { Sale } from "../../types";
import { useState } from "react";
import InvoiceDetailModal from "../../components/Modals/InvoiceDetailModal";

function SaleDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const saleId = id ? parseInt(id, 10) : null;

    const { saleDetail, loading, error } = useFetchSale(saleId);

    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

    const handleBackClick = () => {
        navigate('/sales');
    };

    const handleUpdateSale = (updatedSale: Sale) => {
        console.log(updatedSale);

    }

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!saleDetail) return <div>An unexpected error occured</div>;

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Sale Detail
                    </span>
                </div>
                <div className="flex">
                    {saleDetail.remaining_amount > 0 && saleDetail.remaining_percentage > 0 && (
                        <button
                            className="btn btn-primary flex gap-2 items-center"
                            data-modal-toggle="#generate_invoice_modal"
                        >
                            <i className="ki-filled ki-document text-lg"></i>
                            Generate Invoice
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col mb-4">
                <div className="flex flex-wrap gap-8 mb-8">
                    <div className="left-column flex flex-col flex-[3] gap-8">
                        <div className="card">
                            <div className="card-body pt-3.5 pb-3.5">
                                <table className="table-auto">
                                    <tbody>
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Sale No.:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                {saleDetail.sales_no}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Order No.:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                {saleDetail.order.order_no}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Issued Date:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                {saleDetail.created_at}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-sm text-gray-600 pe-4 lg:pe-8 font-semibold">
                                                Status:
                                            </td>
                                            <td className="text-sm text-gray-900">
                                                <span className={`badge badge-pill cursor-default
                                                ${saleDetail.status === 'issued' ? 'badge-primary' : ''} 
                                                ${saleDetail.status === 'closed' ? 'badge-success' : ''} 
                                                badge-outline`}
                                                >
                                                    {saleDetail.status}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-sm text-gray-600 pe-4 lg:pe-8 font-semibold">
                                                Contact:
                                            </td>
                                            <td className="text-sm text-gray-900">
                                                <button className="btn btn-outline btn-secondary btn-xs my-2">
                                                    View Contact
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col right-column flex-[6] gap-8'>
                        <div className="card">
                            <div className="card-body">
                                <div className="flex flex-col">
                                    <span className="text-lg text-gray-900 mb-1 font-semibold">{100 - (saleDetail.remaining_percentage * 100)}% Payment Progress</span>
                                    <div className="progress progress-success mb-4">
                                        <div className="progress-bar" style={{
                                            width: `${100 - (saleDetail.remaining_percentage * 100)}%`,
                                            height: '12px'
                                        }}>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <div className="card min-w-48">
                                        <div className="card-body flex flex-col justify-center items-center">
                                            <div className="amnt text-gray-900 text-lg font-semibold mb-2">
                                                RM {saleDetail.total_amount.toFixed(2)}
                                            </div>
                                            <span className="text-gray-900 text-base">
                                                Total Amount
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card min-w-48">
                                        <div className="card-body flex flex-col justify-center items-center">
                                            <div className="amnt text-gray-900 text-lg font-semibold mb-2">
                                                RM {saleDetail.remaining_amount.toFixed(2)}
                                            </div>
                                            <span className="text-gray-900 text-base">
                                                Balance (Amount)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card min-w-48">
                                        <div className="card-body">

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

                <div className="flex flex-col">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-gray-900 text-lg font-medium">
                                Payment Invoices
                            </h2>

                            <div className="flex flex-col gap-4">
                                {saleDetail.invoices.map((invoice, index) => (
                                    <div
                                        key={index}
                                        className="card cursor-pointer"
                                        data-modal-toggle="#payment_invoice_modal"
                                        onClick={() => setSelectedInvoiceId(Number(invoice.id))}
                                    >
                                        <div className="card-body">
                                            <h3 className="text-gray-900 text-base font-medium">
                                                {invoice.invoice_no}
                                            </h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <GenerateInvoiceModal
                saleDetail={saleDetail}
                handleUpdateSale={handleUpdateSale}
            />

            <InvoiceDetailModal
                invoiceId={selectedInvoiceId}
            />
        </>
    )
}

export default SaleDetail;