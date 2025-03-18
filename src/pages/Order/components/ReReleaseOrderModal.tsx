interface ReReleaseOrderModalProps {
    handleConfirm: () => void;
}

function ReReleaseOrderModal({ handleConfirm }: ReReleaseOrderModalProps) {
    return (
        <>
            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="re_release_order_modal">
                <div className="modal-content modal-center-y max-w-[500px]">
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-6 justify-center items-center my-4">
                        <div className="modal-title text-lg">
                            Confirm Re-release Order
                        </div>

                        <div className="text-gray-800">
                            Are you sure you want to re-release this order?
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
                                onClick={handleConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ReReleaseOrderModal;