import React from 'react'

interface Props {
    modalId?: string;
    modalTitle?: string;
    modalPrompt?: string;
    modalItemName?: string;
    submitBtnClass?: string;
    submitBtnText?: string;
    handleSubmit?: () => void
}

function ConfirmationModal({ modalId, modalTitle, modalPrompt, modalItemName, submitBtnClass, submitBtnText, handleSubmit }: Props) {
    return (
        <div className="modal p-14" data-modal="true" id={modalId}>
            <div className="modal-content modal-center-y max-w-[500px]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">{modalTitle}</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross"></i>
                    </button>
                </div>
                <div className="modal-body p-0 py-5">
                    <div className="text-2sm text-center text-gray-700 mb-2">
                        {modalPrompt}
                    </div>

                    <div className="text-2sm text-center font-bold text-gray-700 mb-6">
                        {modalItemName}
                    </div>

                    <div className="flex justify-center items-center gap-4">
                        <button className="btn btn-light" data-modal-dismiss="true">
                            Cancel
                        </button>
                        <button
                            className={`btn ${submitBtnClass}`}
                            onClick={handleSubmit}
                        >
                            {submitBtnText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationModal