import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFetchPO from "../../hook/useFetchPO";
import Loading from "../../components/Loading";
import { POItem, PurchaseOrder } from "../../types";
import { Link } from "react-router-dom";
import { markPOItemAsDelivered } from "../../services/api";
import { Slide, toast } from "react-toastify";

function POFulfillment() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { po, loading, error } = useFetchPO(poId);

    const [poDetail, setPo] = useState<PurchaseOrder | null>(null);

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
                notify('success', 'Item mark as delivered successfully');
                setPo((prev) => ({
                    ...prev!,
                    items: prev?.items?.map((item) => {
                        if (item.id === poItem.id) {
                            return {
                                ...item,
                                status: 'delivered',
                                delivered_date: updatedPOItem.delivered_date
                            };
                        }
                        return item;
                    })
                }))
            }

        } catch (error) {
            console.error(error);
        }
    }

    if (!poId) return null;

    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!po) {
        return <div>Purchase Order not found</div>;
    }

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
                <div className="flex">
                    <Link
                        to={'/purchase-order/edit/' + poId}
                        className="btn btn-info btn-sm"
                    >
                        Update PO
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-8 mb-4">
                <div className="flex gap-4">
                    <div className="card w-full">
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
                                            {po.po_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Order Status:
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            <span className={`badge badge-pill cursor-default
                                                        ${po.order_status === 'issued' ? 'badge-primary' : ''} 
                                                        ${po.order_status === 'partial-paid' ? 'badge-info' : ''} 
                                                        ${po.order_status === 'fully-paid' ? 'badge-success' : ''} 
                                                        badge-outline`}
                                            >
                                                {po.order_status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Payment Status:
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            <span className={`badge badge-pill cursor-default
                                                        ${po.payment_status === 'issued' ? 'badge-primary' : ''} 
                                                        ${po.payment_status === 'partial-paid' ? 'badge-info' : ''} 
                                                        ${po.payment_status === 'fully-paid' ? 'badge-success' : ''} 
                                                        badge-outline`}
                                            >
                                                {po.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Total Amount
                                        </td>
                                        <td className="text-xs text-gray-900 pb-3">
                                            RM {po.total_amount.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {po.sale_id && (
                        <div className="card w-full">
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
                                                {po.sale.sales_no}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Status:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                <span className={`badge badge-pill cursor-default
                                                        ${po.sale.status === 'issued' ? 'badge-primary' : ''} 
                                                        ${po.sale.status === 'partial-paid' ? 'badge-info' : ''} 
                                                        ${po.sale.status === 'fully-paid' ? 'badge-success' : ''} 
                                                        badge-outline`}
                                                >
                                                    {po.sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {po.vendor_id && (
                        <div className="card w-full">
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
                                                {po.vendor.name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Email:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {po.vendor.email}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Phone No.:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                +60 {po.vendor.phone_no}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex">
                    <div className="card w-full">
                        <div className="card-body flex flex-col">
                            <div className="flex flex-col">
                                <div className="flex">
                                    <h2 className="text-lg font-semibold mb-4">PO Items</h2>
                                </div>
                                <div className="overflow-y-auto max-h-[500px] scrollable-y">
                                    <table className="table align-middle text-gray-700 font-medium text-2xs">
                                        <thead className="sticky top-0 bg-white z-5 rounded">
                                            <tr>
                                                <th className='w-[10px]'></th>
                                                <th className='w-[250px]'>Item</th>
                                                <th className='w-[250px]'>Description</th>
                                                <th className='w-[70px] text-center'>Qty</th>
                                                {/* <th className='w-[70px] text-center'>Initial Qty</th>
                                                <th className='w-[70px] text-center'>Remaining Qty</th> */}
                                                <th className='w-[70px] text-center'>Status</th>
                                                {/* <th className='w-[70px] text-center'>Shipping Date</th>
                                                <th className='w-[70px] text-center'>ShippedDate</th>
                                                <th className='w-[70px] text-center'>Delivering Date</th> */}
                                                <th className='w-[70px] text-center'>Delivered Date</th>
                                                <th className='w-[70px] text-center'>Delivery/Fulfillment</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {poDetail &&
                                                poDetail.items.map((poProd: POItem, index) => (
                                                    <tr
                                                        key={index}
                                                        className={`${index % 2 === 0 ? '' : 'bg-gray-100'}`}
                                                    >
                                                        <td className="text-center">
                                                            {index + 1}
                                                        </td>
                                                        <td>
                                                            {poProd.product_name}
                                                        </td>
                                                        <td>
                                                            {poProd.product_desc}
                                                        </td>
                                                        <td className="text-center">
                                                            {poProd.qty}
                                                        </td>
                                                        {/* <td className="text-center">
                                                        {po.items.filter((item) => item.status === 'pending').length}
                                                    </td> */}
                                                        <td className="text-center">
                                                            <span className={`badge badge-pill badge-outline
                                                            ${poProd.status === 'delivered' ?
                                                                    'badge-success' :
                                                                    'badge-warning'
                                                                } cursor-default`}
                                                            >
                                                                {poProd.status}
                                                            </span>
                                                        </td>
                                                        {/* <td className="text-center">
                                                        {poProd.shipping_date}
                                                    </td>
                                                    <td className="text-center">
                                                        {poProd.shipped_date}
                                                    </td>
                                                    <td className="text-center">
                                                        {poProd.delivery_date}
                                                    </td> */}
                                                        <td className="text-center">
                                                            {poProd.delivered_date
                                                                ? new Date(poProd.delivered_date).toLocaleDateString('en-GB', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })
                                                                : '-'}
                                                        </td>
                                                        <td className="text-center">
                                                            {poProd.status !== 'delivered' &&
                                                                <button
                                                                    className="btn btn-sm btn-info btn-outline"
                                                                    onClick={() => handleMarkAsDeliver(poProd)}
                                                                >
                                                                    Delivered
                                                                </button>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4"></div>
        </>
    )
}

export default POFulfillment;