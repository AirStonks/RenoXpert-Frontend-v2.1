import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useFetchPO from '../../hook/useFetchPO';
import { useUser } from '../../context/UserContext';
import { Slide, toast } from 'react-toastify';
import Loading from '../../components/Loading';
import CreateInvoiceModal from './components/Modals/CreateInvoiceModal';
import { PurchaseOrder } from '../../types';

function POInvoice() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { poDetail, loading, error, refetch } = useFetchPO(poId);
    const { currentUser, loading: userLoading } = useUser();

    const [po, setPO] = useState<PurchaseOrder | null>(null);

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

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/purchase-orders/' + poId);
        }
    };

    useEffect(() => {
        document.title = "PO Invoices | RenoXpert";

        if (poDetail) {
            setPO(poDetail);
        }
    }, [poDetail]);

    const handleUpdatePO = (updatedPO: PurchaseOrder) => {
        refetch();
    }

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!po) return <div>An unexpected error occured</div>;

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-4">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Purchase Order Detail
                    </span>
                </div>
                <div className="flex gap-3">

                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-4">
                <div className="flex flex-col flex-[2]">
                    <div className="card">
                        <div className="card-header">
                            <span className="font-semibold">General</span>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            PO No.:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {po.po_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            PO Amount:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            RM {po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                    <tr>
                                    </tr>
                                    <tr>
                                    </tr>
                                    <tr>
                                    </tr>
                                    <tr>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col flex-1">
                    <div className="card">
                        <div className="card-body">

                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-4">
                <div className="flex flex-col flex-[2]">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <span className='font-semibold'>Billing and Invoicing</span>
                            <div className="flex">
                                <button
                                    className="btn btn-primary btn-sm"
                                    data-modal-toggle="#generate_invoice_modal"
                                >
                                    Generate Invoice
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="flex flex-col gap-2">
                                {po.invoices.map((invoice, index) => (
                                    <div
                                        className="card cursor-pointer"
                                        key={index}
                                    // data-modal-toggle="#generate_invoice_modal"
                                    // onClick={() => setSelectedInvoiceId(Number(invoice.id))}
                                    >
                                        <div className="card-body flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="relative size-[50px] shrink-0">
                                                    <svg className="w-full h-full stroke-info-clarity fill-info-light" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="#EFF6FF">
                                                        </path>
                                                        <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                                        </path>
                                                    </svg>
                                                    <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                        <i className="ki-outline ki-document text-1.5xl ps-px text-info"></i>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-gray-900 text-sm font-medium">
                                                        {invoice.invoice_no}
                                                    </h3>

                                                    <div className="flex gap-14">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Amount:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Due Date:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {invoice.due_date
                                                                    ? new Date(invoice.due_date).toLocaleDateString('en-GB', {
                                                                        day: 'numeric',
                                                                        month: 'long',
                                                                        year: 'numeric'
                                                                    })
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="status">
                                                <span className={`badge badge-pill badge-outline gap-1 items-center
                                                ${invoice.status === 'paid' ? 'badge-success' : ''} ${invoice.status === 'overdue' ? 'badge-danger' : ''}`}>
                                                    <span className={`badge badge-dot size-1.5 ${invoice.status === 'unpaid' ? 'badge-dark' : ''} ${invoice.status === 'paid' ? 'badge-success' : ''} ${invoice.status === 'overdue' ? 'badge-danger' : ''}`}></span>
                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div >
                <div className="flex flex-col flex-1">

                </div>
            </div >

            <CreateInvoiceModal
                poDetail={po}
                handleUpdatePO={handleUpdatePO}
            />
        </>
    )
}

export default POInvoice