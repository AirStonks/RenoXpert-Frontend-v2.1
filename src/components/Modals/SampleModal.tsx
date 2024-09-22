function SampleModal() {
    return (
        <div className="modal p-14" data-modal="true" id="sample_modal">
            <div className="modal-content modal-overlay">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Create New Product</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross"></i>
                    </button>
                </div>
                <div className="modal-body p-0 pb-5">

                </div>
            </div>
        </div>
    );
}

export default SampleModal;