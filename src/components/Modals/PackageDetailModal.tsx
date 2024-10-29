// src\components\Modals\PackageDetailModal.tsx

import React, { useEffect } from "react";
import useFetchPackage from "../../hook/useFetchPackage";
import Loading from "../Loading";
import { Link } from "react-router-dom";
import { KTModal } from "../../metronic/core";

interface PackageDetailModalProps {
    packageId: number | null;
}

function PackageDetailModal({ packageId }: PackageDetailModalProps) {
    const { packageDetail, loading, error } = useFetchPackage(packageId);

    useEffect(() => {
        console.log('Package ID:', packageId);
    }, [packageId]);

    const handleClose = () => {
        const modalEl = document.querySelector('#package_detail_modal') as HTMLElement;
        const modal = KTModal.getInstance(modalEl);

        modal.toggle();
    }

    if (!packageId) return null; // Early return for null packageId

    let content;

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!packageDetail) {
        content = <div>Product Category not found</div>;
    } else {

        content = (
            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>

                            <Link
                                to={'/packages/edit/' + packageId}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                onClick={handleClose}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Package Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {packageDetail.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Price:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${packageDetail.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className="badge badge-sm badge-success badge-outline">
                                                Available
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Type:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            -
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Last Order:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            -
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Signed Up:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            -
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[6] gap-8'>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Products
                            </h3>

                            <Link
                                to={'/packages/edit/' + packageId}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                onClick={handleClose}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>
                        <div className="card-table pb-3.5">
                            <table className="table align-middle text-gray-700 font-medium text-sm">
                                <thead>
                                    <tr>
                                        <th className='w-[20px]'>ID</th>
                                        <th className='w-[250px]'>Product</th>
                                        <th className='w-[50px] text-center'>Quantity</th>
                                        <th className='w-[100px] text-center'>Visibility</th>
                                        <th className='w-[100px]'>Unit Price</th>
                                        <th className='w-[100px]'>Total Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packageDetail.products.map((product, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span>{product.id}</span>
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
                                                    {product.pivot.quantity}
                                                </span>
                                            </td>
                                            <td>
                                                <label className="switch flex justify-center">
                                                    <input
                                                        name="visibility"
                                                        type="checkbox"
                                                        checked={product.pivot.visibility}
                                                        readOnly
                                                    />
                                                </label>
                                            </td>
                                            <td>
                                                RM {product.product_retail_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                RM {(product.product_retail_price * product.pivot.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="modal p-14"
                data-modal="true"
                id="package_detail_modal"
                aria-modal="true"
                role="dialog"
            >
                <div className="modal-content modal-center-y max-w-7xl h-4/5 max-h-[80%] scrollable">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Package Detail</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            aria-label="Close"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body p-5 scrollable">
                        {content}
                    </div>
                </div>
            </div>
        </>
    );
}

export default PackageDetailModal;