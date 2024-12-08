import { useNavigate, useParams } from "react-router-dom";
import useFetchPO from "../../hook/useFetchPO";
import { useEffect } from "react";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { POItem } from "../../types";

function PODetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { po, loading, error } = useFetchPO(poId);

    const handleBackClick = () => {
        navigate('/purchase-orders');
    };

    useEffect(() => {
        document.title = 'Purchase Order Detail | RenoXpert';
    }, []);

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
                <div className="flex flex-[6]">
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
                                                <th className='w-[100px] text-center'>Price per Qty</th>
                                                <th className='w-[70px] text-center'>Qty</th>
                                                <th className='w-[100px] text-center'>Total Price</th>
                                                <th className='w-[10px] text-center'>Supply</th>
                                                <th className='w-[10px] text-center'>Install</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {po.items.map((poProd: POItem, index) => (
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
                                                        RM {poProd.unit_price}
                                                    </td>
                                                    <td className="text-center">
                                                        {poProd.qty}
                                                    </td>
                                                    <td className="text-center">
                                                        RM {poProd.unit_price * poProd.qty}
                                                    </td>
                                                    <td className="text-center">
                                                        <input
                                                            className="checkbox"
                                                            name="sel_prod"
                                                            type="checkbox"
                                                            checked={!!poProd.supply}
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <input
                                                            className="checkbox"
                                                            name="sel_prod"
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4"></div>
        </>
    )
}

export default PODetail;