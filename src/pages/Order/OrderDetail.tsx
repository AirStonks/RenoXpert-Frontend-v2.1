// src\pages\Order\OrderDetailPage.tsx

import { useEffect } from "react";
import Loading from "../../components/Loading";
import useFetchOrder from "../../hook/useFetchOrder";
import { KTAccordion } from "../../metronic/core";
import { OrderQuotation, Package } from "../../types";
import { Link, useNavigate, useParams } from "react-router-dom";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";

function OrderDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const { orderDetail, loading, error } = useFetchOrder(orderId);

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
        KTAccordion.init();

        // if (orderDetail) {
        //     console.log(JSON.parse(JSON.stringify(orderDetail.total_amount)));
        // }

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
            console.log('yeet');
        });

        return () => {
            clipboard.destroy();
        };

    }, [orderDetail]);

    if (!orderId) return null; // Early return for null orderId

    const handleBackClick = () => {
        navigate('/orders');
    };

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!orderDetail) return <div>Order not found</div>;

    // console.log(orderDetail);
    const selectedQuotation = JSON.parse(JSON.stringify(orderDetail.latest_quotation)) as OrderQuotation;
    const selectedPackages = JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata))) as Package[];
    // console.log(selectedQuotation);

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Order Detail
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>

                            <Link
                                to={`/orders/edit/${orderId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={orderId}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Order No:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.order_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Amount:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${orderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className={`badge badge-sm p-2 cursor-default
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' ? 'badge-danger' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Link Management
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Preview Link:</td>
                                        <td>
                                            <button
                                                className="btn btn-outline btn-sm btn-primary"
                                                onClick={() => { window.open(`http://${window.location.hostname}:5173/preview/owner/order/overview/id/${orderDetail.id}`, '_blank'); }}
                                            >
                                                View Order Overview
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Link Status:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <select
                                                className="select select-sm max-w-24"
                                            // value={invoice.link_status}
                                            // onChange={(e) => handleChangeLinkStatus(e.target.value)} // Pass the new status here
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="deactivate">Deactivate</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Link:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <div className="input w-auto">
                                                <input
                                                    className="w-auto cursor-pointer"
                                                    id="clipboard_1_target"
                                                    placeholder="Copy to clipboard"
                                                    type="text"
                                                    value={`http://${window.location.hostname}:5173/owner/order/overview/id/${orderDetail.id}`}
                                                    onClick={() => { window.open(`http://${window.location.hostname}:5173/owner/order/overview/id/${orderDetail.id}`, '_blank'); }}
                                                    readOnly
                                                />
                                                <button
                                                    className="btn btn-icon copy-link"
                                                    id="clipboard_1_button"
                                                    data-clipboard-text={`http://${window.location.hostname}:5173/owner/order/overview/id/${orderDetail.id}`}
                                                >
                                                    <i className="ki-outline ki-copy"></i>
                                                </button>
                                            </div>

                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Contact
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.user.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Email:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.user.email}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Phone No.:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.user.phone_no}
                                        </td>
                                    </tr>
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
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Property Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.property.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Unit:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Address:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {[
                                                orderDetail.property.address,
                                                orderDetail.property.street,
                                                orderDetail.property.postcode,
                                                orderDetail.property.city,
                                                orderDetail.property.state,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')
                                            }
                                        </td>

                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[6] gap-4'>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Quotation
                            </h3>

                            <Link
                                to={`/orders/edit/${orderId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={orderId}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>

                        {selectedQuotation && (
                            <div className="card-body">
                                <div className="flex flex-col">
                                    <span className='text-lg font-semibold text-gray-900'>
                                        {selectedQuotation.quotation_name}
                                    </span>
                                    <span className="text-base font-normal text-gray-800">
                                        Price: RM {selectedQuotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-base font-normal text-slate-400">
                                        {selectedQuotation.description}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedQuotation && (
                        <div className="card">
                            <div className="card-body">
                                <div className="text-base font-semibold text-gray-900 mb-2">
                                    Packages:
                                </div>
                                <div className="flex flex-col gap-5" data-accordion="true">
                                    {selectedPackages.map((prodPackage: Package) => (
                                        <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                            <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {prodPackage.name}
                                                        </span>
                                                        <span className='text-base text-slate-700'>
                                                            RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className='text-sm text-slate-400'>
                                                            {prodPackage.description}
                                                        </span>
                                                    </div>
                                                </button>
                                                <div className="accordion-content active border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                    <div className="product-list flex flex-col">
                                                        <table className="table align-middle text-gray-700 font-medium text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className='w-[10px] text-center'>Supply</th>
                                                                    <th className='w-[10px] text-center'>Install</th>
                                                                    <th className='w-[250px]'>Product</th>
                                                                    <th className='w-[100px] text-center'>Quantity</th>
                                                                    <th className='w-[100px] text-center'>Unit Price</th>
                                                                    <th className='w-[100px] text-center'>Discount</th>
                                                                    <th className='w-[100px] text-center'>Total Price</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {prodPackage.products.map((product) => (
                                                                    <tr
                                                                        key={product.id}
                                                                    >
                                                                        <td>
                                                                            <span></span>
                                                                            <div className="flex flex-col items-center">
                                                                                <input
                                                                                    className="checkbox"
                                                                                    name="supply"
                                                                                    type="checkbox"
                                                                                    checked={!!product.pivot.includeSupply}
                                                                                    readOnly
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className="flex flex-col items-center">
                                                                                <input
                                                                                    className="checkbox"
                                                                                    name="install"
                                                                                    type="checkbox"
                                                                                    checked={!!product.pivot.includeInstall}
                                                                                    readOnly
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className="flex flex-col">
                                                                                <span>{product.name}</span>
                                                                                <span className="text-xs text-slate-400">{product.description}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className='text-center text-lg'>
                                                                            <span className="mx-2 text-base">
                                                                                {product.pivot.included ? product.pivot.quantity : '0'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            {!product.pivot.includeSupply || !product.pivot.includeInstall
                                                                                ? `- RM ${(
                                                                                    (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0) +
                                                                                    (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                )
                                                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                : null}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {!product.pivot.included
                                                                                ? null
                                                                                : `RM ${(
                                                                                    (product.provisioning.supply.retail_price * product.pivot.quantity -
                                                                                        (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0)
                                                                                    ) +
                                                                                    (product.provisioning.install.retail_price * product.pivot.quantity -
                                                                                        (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                    )
                                                                                )
                                                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default OrderDetail;