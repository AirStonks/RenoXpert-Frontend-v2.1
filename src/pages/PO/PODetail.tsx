import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchPO from "../../hook/useFetchPO";
import { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { POItem, POPackage } from "../../types";
import { useUser } from "../../context/UserContext";
import ConfirmationModal from "./components/ConfirmationModal";
import { acceptPO, rejectPO } from "../../services/api";
import { Slide, toast } from "react-toastify";
import { KTModal } from "../../metronic/core";

function PODetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { poDetail, loading, error, refetch } = useFetchPO(poId);
    const { currentUser, loading: userLoading } = useUser();

    const [openAccordions, setOpenAccordions] = useState({});

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
            navigate('/purchase-orders');
        }
    };

    useEffect(() => {
        document.title = 'Purchase Order Detail | RenoXpert';
    }, []);

    const handleAcceptPo = async () => {
        try {
            const response = await acceptPO(Number(poDetail.id));

            if (response?.success) {
                refetch();

                const modalEl = document.querySelector('#po_accept_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                console.log(modal);


                modal.hide();

                notify('success', "PO Accepted Successfully!");
            }

        } catch (error) {
            notify('error', 'Error occurred during PO acceptance.');
        }
    }

    const handleRejectPo = async () => {
        try {
            const response = await rejectPO(Number(poDetail.id));

            if (response?.success) {
                refetch();

                const modalEl = document.querySelector('#po_reject_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();

                notify('success', "PO Rejected Successfully!");
            }

        } catch (error) {
            notify('error', 'Error occurred during PO rejection.');
        }
    }

    if (!poId) return null;

    if (loading || userLoading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!poDetail) {
        return <div>Purchase Order not found</div>;
    }

    const toggleAccordion = (packageId) => {
        setOpenAccordions(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }));
    };

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
                    {currentUser.type !== 'backend-vendor' ?
                        <Link
                            to={'/purchase-orders/edit/' + poId}
                            className="btn btn-info btn-sm"
                        >
                            Edit PO
                        </Link>
                        :
                        poDetail.order_status === 'released' &&

                        <>
                            <button
                                className="btn btn-success btn-sm"
                                data-modal-toggle="#po_accept_modal"
                            >
                                Accept Order
                            </button>
                            <button
                                className="btn btn-danger btn-outline btn-sm"
                                data-modal-toggle="#po_reject_modal"
                            >
                                Reject Order
                            </button>
                        </>
                    }
                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-64 py-2" data-dropdown-dismiss="true">
                            <div className="menu-item">
                                <Link
                                    to={`/purchase-orders/print/${poId}`}
                                    className="menu-link"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-file-down text-lg"></i>
                                            <span>Print PO</span>
                                        </div>
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-8 mb-4">
                <div className="flex flex-col flex-[2] gap-4">

                    <div className="card">
                        <div className="card-header">
                            <span className="font-semibold">General</span>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            PO No.:
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            {poDetail.po_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Created Date:
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            {poDetail.created_at
                                                ? new Date(poDetail.created_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Order Status:
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            <span className={`badge badge-pill cursor-default capitalize
                                                        ${poDetail.order_status === 'released' ? 'badge-primary' : ''} 
                                                        ${poDetail.order_status === 'accepted' ? 'badge-success' : ''} 
                                                        ${poDetail.order_status === 'rejected' ? 'badge-danger' : ''} 
                                                        badge-outline`}
                                            >
                                                {poDetail.order_status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Payment Status:
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            <span className={`badge badge-pill cursor-default
                                                        ${poDetail.payment_status === 'issued' ? 'badge-primary' : ''} 
                                                        ${poDetail.payment_status === 'partial-paid' ? 'badge-info' : ''} 
                                                        ${poDetail.payment_status === 'fully-paid' ? 'badge-success' : ''} 
                                                        badge-outline`}
                                            >
                                                {poDetail.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Total Amount
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            RM {poDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>


                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Owner
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {poDetail.sale ?
                                        <>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Name:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.user.name}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Email:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.user.email}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Phone No.:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    +{poDetail.sale.order.user.country_code} {poDetail.sale.order.user.phone_no}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            N/A
                                        </td>
                                    }
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
                                    {poDetail.sale ?
                                        <>

                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Property Name:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.property.name}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Unit:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.block}-{poDetail.sale.order.floor}-{poDetail.sale.order.unit_no}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Unit Type:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.unit_type ? poDetail.sale.order.unit_type : "-"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Address:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {[
                                                        poDetail.sale.order.property.address,
                                                        poDetail.sale.order.property.street,
                                                        poDetail.sale.order.property.postcode,
                                                        poDetail.sale.order.property.city,
                                                        poDetail.sale.order.property.state,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')
                                                    }
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Bedroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.bedroom_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Bathroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.bathroom_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Partition:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {poDetail.sale.order.include_partition ? 'Yes' : 'No'}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            N/A
                                        </td>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {poDetail.sale_id && (
                        <div className="card">
                            <div className="card-header">
                                <span className="font-semibold">Sales Order Detail</span>
                            </div>
                            <div className="card-body">
                                <table className="table-auto">
                                    <tbody>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Sales No:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {poDetail.sale.sales_no}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Status:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                <span className={`badge badge-pill cursor-default
                                                        ${poDetail.sale.status === 'issued' ? 'badge-primary' : ''} 
                                                        ${poDetail.sale.status === 'partial-paid' ? 'badge-info' : ''} 
                                                        ${poDetail.sale.status === 'fully-paid' ? 'badge-success' : ''} 
                                                        badge-outline`}
                                                >
                                                    {poDetail.sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {poDetail.vendor_id && (
                        <div className="card">
                            <div className="card-header">
                                <span className="font-semibold">Vendor Detail</span>
                            </div>
                            <div className="card-body">
                                <table className="table-auto">
                                    <tbody>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Vendor Name:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {poDetail.vendor.name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Email:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {poDetail.vendor.email}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Phone No.:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {/* +{poDetail.vendor.country} {poDetail.vendor.phone_no} */}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-[6]">
                    <div className="card w-full">
                        <div className="card-body flex flex-col">
                            <div className="flex flex-col">
                                <div className="flex">
                                    <h2 className="text-lg font-semibold mb-4">PO Items</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {poDetail.po_packages.map((poPackage: POPackage, index) => (
                                        <div
                                            key={index}
                                            className="accordion rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white"
                                        >
                                            {/* Accordion Header */}
                                            <div
                                                className="accordion-header flex items-center justify-between w-full p-5 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                                onClick={() => toggleAccordion(index)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-gray-800 font-semibold text-sm">{poPackage.name}</span>
                                                    <span className="text-gray-600 font-semibold text-sm">RM {(poPackage.total_price * poPackage.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {/* Package Quantity Input */}
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="text"
                                                            className="input input-sm text-center px-2 w-12 border-gray-200 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200 disabled"
                                                            value={poPackage.quantity || 1} // Assuming package has a qty 
                                                            readOnly
                                                        />
                                                    </div>
                                                    <i className={`ki-solid ki-down text-gray-600 transition-transform duration-300 ease-in-out ${openAccordions[index] ? 'rotate-180' : ''}`}></i>
                                                </div>
                                            </div>

                                            {/* Accordion Content */}
                                            <div
                                                className={`accordion-content overflow-hidden transition-all duration-300 ease-in-out ${openAccordions[index]
                                                    ? 'opacity-100'
                                                    : 'max-h-0 opacity-0 p-0'
                                                    }`}
                                            >
                                                <table className="table align-middle text-gray-700 font-medium text-2xs w-full">
                                                    <thead className="bg-gray-100 rounded-t">
                                                        <tr className="text-gray-600">
                                                            <th className="w-[180px] p-3">Item</th>
                                                            <th className="w-[180px] p-3">Description</th>
                                                            <th className="w-[100px] p-3 text-center">Supply Price</th>
                                                            <th className="w-[100px] p-3 text-center">Install Price</th>
                                                            <th className="w-[70px] p-3 text-center">Qty</th>
                                                            <th className="w-[50px] p-3 text-center">UOM</th>
                                                            <th className="w-[100px] p-3 text-center">Total Supply</th>
                                                            <th className="w-[100px] p-3 text-center">Total Install</th>
                                                            <th className="w-[100px] p-3 text-center">Total Price</th>
                                                            <th className="w-[10px] p-3 text-center">Supply</th>
                                                            <th className="w-[10px] p-3 text-center">Install</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {poPackage.po_items.map((poProd: POItem, index) => (
                                                            <tr
                                                                key={index}
                                                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${!poProd.supply && !poProd.install ? 'bg-orange-50' : ''
                                                                    }`}
                                                            >
                                                                <td className="p-3">{poProd.product_name}</td>
                                                                <td className="p-3 text-gray-600">{poProd.product_desc}</td>
                                                                <td className="p-3 text-center">RM {poProd.supply_price}</td>
                                                                <td className="p-3 text-center">RM {poProd.install_price}</td>
                                                                <td className="p-3 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            className="input input-sm text-center px-2 w-12 border-gray-200 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200 disabled"
                                                                            value={poProd.qty}
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    {poProd.uom}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {poProd.supply ?
                                                                        <span className="text-green-600">RM {(poProd.supply_price * poProd.qty).toFixed(2)}</span>
                                                                        : <span className="text-gray-400">-</span>
                                                                    }
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {poProd.install ?
                                                                        <span className="text-green-600">RM {(poProd.install_price * poProd.qty).toFixed(2)}</span>
                                                                        : <span className="text-gray-400">-</span>
                                                                    }
                                                                </td>
                                                                <td className="p-3 text-center font-semibold">
                                                                    RM {(((poProd.supply ? poProd.supply_price : 0) + (poProd.install ? poProd.install_price : 0)) * poProd.qty).toFixed(2)}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <input
                                                                        className="checkbox checkbox-sm rounded checked:bg-primary"
                                                                        type="checkbox"
                                                                        checked={!!poProd.supply}
                                                                        readOnly
                                                                    />
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <input
                                                                        className="checkbox checkbox-sm rounded checked:bg-primary"
                                                                        type="checkbox"
                                                                        checked={!!poProd.install}
                                                                        readOnly
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4"></div>

            <ConfirmationModal
                modalId="po_accept_modal"
                modalTitle="Accept PO"
                modalPrompt="Are you sure you want to accept this PO?"
                modalItemName={poDetail.po_no}
                submitBtnClass="btn-success"
                submitBtnText="Accept"
                handleSubmit={handleAcceptPo}
            />

            <ConfirmationModal
                modalId="po_reject_modal"
                modalTitle="Reject PO"
                modalPrompt="Are you sure you want to reject this PO?"
                modalItemName={poDetail.po_no}
                submitBtnClass="btn-danger"
                submitBtnText="Reject"
                handleSubmit={handleRejectPo}
            />
        </>
    )
}

export default PODetail;