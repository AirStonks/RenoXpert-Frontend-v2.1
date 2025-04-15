import React from 'react'
import { Package } from '../../../../types';

interface Props {
    pkg: Package | null
    onSubmit: (pkgId: number) => void;
}

function ConfirmUnincludeAddon({ pkg, onSubmit }: Props) {
    return (
        <div className="modal p-14 text-xs" data-modal="true" id="confirm_uninclude_modal">
            <div className="modal-content modal-center-y max-w-4xl max-h-[95%] bg-white rounded-lg shadow-xl">
                <div className="modal-header px-5 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-900 font-bold">Uninclude Addon Package</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross text-xl"></i>
                    </button>
                </div>
                <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-2 justify-center items-center my-2">
                    <div className="modal-title text-center">
                        Confirm Uninclude Addon Package
                    </div>

                    <div className="text-gray-800">
                        Are you sure you want uninclude this add-on package?
                    </div>

                    <div className="font-semibold text-orange-500">
                        {pkg?.name}
                    </div>

                    <div className="flex gap-4">
                        <button
                            className="btn btn-secondary btn-sm"
                            data-modal-dismiss="true"
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-success btn-sm"
                            onClick={() => onSubmit(pkg.id)}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmUnincludeAddon