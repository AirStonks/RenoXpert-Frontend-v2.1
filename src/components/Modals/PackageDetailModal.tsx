// src\components\Modals\PackageDetailModal.tsx

import React, { useEffect } from "react";
import useFetchPackage from "../../hook/useFetchPackage";
import Loading from "../Loading";
import EditPackageModal from "./EditPackageModal";
import { KTModal } from "../../metronic/core";

interface PackageDetailModalProps {
    packageId: number | null;
    onClose: () => void; // Add this prop
}

function PackageDetailModal({ packageId, onClose }: PackageDetailModalProps) {
    const { packageDetail, loading, error } = useFetchPackage(packageId);

    useEffect(() => {
        console.log('Package ID:', packageId);
    }, [packageId]);

    const handleClose = () => {
        onClose(); // Call the passed function to reset packageId
    };

    if (!packageId) return null; // Early return for null packageId

    let content;

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!packageDetail) {
        content = <div>Product Category not found</div>;
    } else {
        const modalEl = document.querySelector('#package_detail_modal') as HTMLElement;
        const modal = KTModal.getInstance(modalEl);

        content = (
            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>

                            <button
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={packageId}
                                data-modal-toggle="#edit_package_modal"
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </button>
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

                            <button
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={packageId}
                                data-modal-toggle="#edit_package_modal"
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </button>
                        </div>
                        <div className="card-table pb-3.5">
                            <table className="table align-middle text-gray-700 font-medium text-sm">
                                <thead>
                                    <tr>
                                        <th className='w-[150px]'>Product</th>
                                        <th className='w-[100px] text-center'>Quantity</th>
                                        <th className='w-[100px]'>Unit Price</th>
                                        <th className='w-[100px]'>Total Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packageDetail.products.map((product, index) => (
                                        <tr key={index}>
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
                                                RM {product.price.toFixed(2)}
                                            </td>
                                            <td>
                                                RM {(product.price * product.pivot.quantity).toFixed(2)}
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

        modal.on('hide', (detail) => {
            // detail.cancel = true;
            console.log('layer 1');
            
            handleClose();
        });

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
                <div className="modal-content modal-center-y max-w-[1024px] h-[580px] max-h-[580px] scrollable">
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
                    <div className="modal-body p-5">
                        {content}
                    </div>
                </div>
            </div>

            <EditPackageModal packageDetail={packageDetail} />
        </>
    );
}

export default PackageDetailModal;