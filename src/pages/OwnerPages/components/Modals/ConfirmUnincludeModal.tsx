import React, { useState } from 'react'
import { Order } from '../../../../types';
import React from 'react';
import { Slide, toast } from 'react-toastify';

const APP_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_APP_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_APP_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_APP_URL
                : null;

interface Props {
    orderDetail: Order | null
    setOrderDetail: React.Dispatch<React.SetStateAction<Order | null>> | null
    
}

function ConfirmUnincludeModal({ orderDetail, setOrderDetail }: Props) {
    const [isLoading, setIsLoading] = useState<boolean>(false);

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

    return (
        <div className="modal p-14" data-modal="true" id="confirm_uninclude_modal">
            <div className="modal-content modal-center-y max-w-4xl max-h-[95%] bg-white rounded-lg shadow-xl">
                <div className="modal-header py-4 px-5 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-lg text-gray-900 font-bold">MO Access Management</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross text-xl"></i>
                    </button>
                </div>
                <div className="modal-body p-5">
                    <div className="space-y-6">
                        {/* Warning/Note */}
                        {/* {diForm?.status === 'not_submitted' &&
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                                <p className="text-sm font-medium">
                                    <strong>Note:</strong> For best practice, please ensure the DIR status is submitted or completed before activating the MO access link.
                                </p>
                            </div>
                        } */}

                        {/* Link Information */}
                        <div className="grid grid-cols-1 gap-6">
                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">MO Access Link</label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="text"
                                        id="clipboard_2_target"
                                        value={`${APP_URL}di-form/report?id=${diForm?.report_hash}`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-gray-50"
                                        readOnly
                                    />
                                    <button className="btn btn-sm btn-light border border-gray-300 hover:bg-gray-100 p-2" id="clipboard_2_button">
                                        <i className="ki-filled ki-copy text-gray-600"></i>
                                    </button>
                                </div>
                            </div> */}

                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link Status</label>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                                        ${diForm?.link_status === 'active' ? 'bg-green-100 text-green-800' : ''}
                                        ${diForm?.link_status === 'unactive' ? 'bg-red-100 text-red-800' : ''}
                                    `}>
                                    {diForm?.link_status.charAt(0).toUpperCase() + diForm?.link_status.slice(1)}
                                </div>
                            </div> */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link Details</label>
                                <div className="text-sm text-gray-600 space-y-1">
                                    {/* <p>Created: April 01, 2025 09:00</p>
                                        <p>Last Updated: April 01, 2025 14:30</p>
                                        <p>Access Count: 24</p> */}
                                    <p>-</p>
                                </div>
                            </div>

                            {/* Link Management Action */}
                            {/* <div className="flex space-x-3">
                                <button className={`btn btn-sm btn-danger px-4 py-2 rounded
                                        ${diForm?.link_status === 'active' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                                        ${diForm?.link_status === 'unactive' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                                    `}
                                    onClick={handleChangeLinkStatus}
                                >
                                    {diForm?.link_status === 'active' ? 'Unactivate Link' : 'Activate Link'}
                                </button>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmUnincludeModal