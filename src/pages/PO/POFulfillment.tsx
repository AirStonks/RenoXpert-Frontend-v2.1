import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import useFetchPO from "../../hook/useFetchPO";
import Loading from "../../components/Loading";
import { POItem, PurchaseOrder, POPackage } from "../../types";
import { markPOItemAsDelivered } from "../../services/api";
import { Slide, toast } from "react-toastify";

function POFulfillment() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { po, loading, error } = useFetchPO(poId);
    const [poDetail, setPo] = useState<PurchaseOrder | null>(null);
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
        navigate('/purchase-orders');
    };

    useEffect(() => {
        document.title = 'PO Delivery/Fulfillment | RenoXpert';
        if (po) {
            setPo(po);
        }
    }, [po]);

    const handleMarkAsDeliver = async (poItem: POItem) => {
        try {
            const response = await markPOItemAsDelivered(Number(poItem.id));
            const updatedPOItem: POItem = response.data;

            if (response?.success) {
                notify('success', 'Item marked as delivered successfully');
                setPo((prev) => ({
                    ...prev!,
                    po_packages: prev?.po_packages.map((pkg) => ({
                        ...pkg,
                        po_items: pkg.po_items.map((item) =>
                            item.id === poItem.id
                                ? {
                                    ...item,
                                    status: 'delivered',
                                    delivered_date: updatedPOItem.delivered_date
                                }
                                : item
                        )
                    }))
                }));
            }
        } catch (error) {
            console.error(error);
            notify('error', 'Failed to mark item as delivered');
        }
    };

    const toggleAccordion = (packageId) => {
        setOpenAccordions(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }));
    };

    if (!poId) return null;

    if (loading) return <Loading />;
    if (error) return <div className="text-red-600">Something went wrong: {error}</div>;
    if (!poDetail) return <div>Purchase Order not found</div>;

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-4">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Purchase Order Fulfillment
                    </span>
                </div>
                {/* <div className="flex">
                    <Link to={`/purchase-order/edit/${poId}`} className="btn btn-info btn-sm">
                        Update PO
                    </Link>
                </div> */}
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
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">PO No.:</td>
                                        <td className="text-xs text-gray-900 pb-3">{poDetail.po_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Created Date:</td>
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
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Order Status:</td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            <span className={`badge badge-pill cursor-default
                                                ${poDetail.order_status === 'issued' ? 'badge-primary' : ''} 
                                                ${poDetail.order_status === 'partial-paid' ? 'badge-info' : ''} 
                                                ${poDetail.order_status === 'fully-paid' ? 'badge-success' : ''} 
                                                badge-outline`}>
                                                {poDetail.order_status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Payment Status:</td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            <span className={`badge badge-pill cursor-default
                                                ${poDetail.payment_status === 'issued' ? 'badge-primary' : ''} 
                                                ${poDetail.payment_status === 'partial-paid' ? 'badge-info' : ''} 
                                                ${poDetail.payment_status === 'fully-paid' ? 'badge-success' : ''} 
                                                badge-outline`}>
                                                {poDetail.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Total Amount</td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            RM {poDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
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
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Sales No:</td>
                                            <td className="text-xs text-gray-900 pb-3">{poDetail.sale.sales_no}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Status:</td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                <span className={`badge badge-pill cursor-default
                                                    ${poDetail.sale.status === 'issued' ? 'badge-primary' : ''} 
                                                    ${poDetail.sale.status === 'partial-paid' ? 'badge-info' : ''} 
                                                    ${poDetail.sale.status === 'fully-paid' ? 'badge-success' : ''} 
                                                    badge-outline`}>
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
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Vendor Name:</td>
                                            <td className="text-xs text-gray-900 pb-3">{poDetail.vendor.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Email:</td>
                                            <td className="text-xs text-gray-900 pb-3">{poDetail.vendor.email}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Phone No.:</td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                +{poDetail.vendor.country_code} {poDetail.vendor.phone_no}
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
                                <h2 className="text-lg font-semibold mb-4">PO Items</h2>
                                <div className="flex flex-col gap-4">
                                    {poDetail.po_packages.map((poPackage: POPackage, index) => (
                                        <div
                                            key={index}
                                            className="accordion rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white"
                                        >
                                            <div
                                                className="accordion-header flex items-center justify-between w-full p-5 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                                onClick={() => toggleAccordion(index)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-gray-800 font-semibold text-sm">{poPackage.name}</span>
                                                    <span className="text-gray-600 font-semibold text-sm">
                                                        RM {(poPackage.total_price * poPackage.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="text"
                                                            className="input input-sm text-center px-2 w-12 border-gray-200 disabled"
                                                            value={poPackage.quantity || 1}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <i className={`ki-solid ki-down text-gray-600 transition-transform duration-300 ease-in-out ${openAccordions[index] ? 'rotate-180' : ''}`}></i>
                                                </div>
                                            </div>

                                            <div
                                                className={`accordion-content overflow-hidden transition-all duration-300 ease-in-out ${openAccordions[index]
                                                    ? 'max-h-[1000px] opacity-100'
                                                    : 'max-h-0 opacity-0 p-0'
                                                    }`}
                                            >
                                                <table className="table align-middle text-gray-700 font-medium text-2xs w-full">
                                                    <thead className="bg-gray-100 rounded-t">
                                                        <tr className="text-gray-600">
                                                            <th className="w-[180px] p-3">Item</th>
                                                            <th className="w-[180px] p-3">Description</th>
                                                            <th className="w-[70px] p-3 text-center">Qty</th>
                                                            <th className="w-[100px] p-3 text-center">Status</th>
                                                            <th className="w-[100px] p-3 text-center">Delivered Date</th>
                                                            <th className="w-[120px] p-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {poPackage.po_items.map((poProd: POItem, index) => (
                                                            <tr
                                                                key={index}
                                                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150`}
                                                            >
                                                                <td className="p-3">{poProd.product_name}</td>
                                                                <td className="p-3 text-gray-600">{poProd.product_desc}</td>
                                                                <td className="p-3 text-center">{poProd.qty}</td>
                                                                <td className="p-3 text-center">
                                                                    <span className={`badge badge-pill badge-outline
                                                                        ${poProd.status === 'delivered' ? 'badge-success' : 'badge-warning'}
                                                                        cursor-default`}>
                                                                        {poProd.status}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {poProd.delivered_date
                                                                        ? new Date(poProd.delivered_date).toLocaleDateString('en-GB', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })
                                                                        : '-'}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {poProd.status !== 'delivered' && (
                                                                        <button
                                                                            className="btn btn-sm btn-info btn-outline"
                                                                            onClick={() => handleMarkAsDeliver(poProd)}
                                                                        >
                                                                            Mark as Delivered
                                                                        </button>
                                                                    )}
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
        </>
    );
}

export default POFulfillment;