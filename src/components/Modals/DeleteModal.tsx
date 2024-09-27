// src/components/Modals/DeleteProductModal.tsx

import { Slide, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { KTModal } from '../../metronic/core';

interface DeleteModalProps {
    item: { id: number, name: string } | null;
    modalTitle?: string;
    modalPrompt?: string;
    notifySuccess?: string;
    notifyError?: string;
    navigateUrl?: string;
    deleteFunction: (id: number) => Promise<{ success: boolean; message?: string }>; // New prop for delete function
}

function DeleteModal({
    item,
    modalTitle,
    modalPrompt,
    notifySuccess,
    notifyError,
    navigateUrl,
    deleteFunction, // Destructure new prop
}: DeleteModalProps) {
    const navigate = useNavigate();
    
    if (!item) return null; // Return nothing if no item is selected

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

    const handleSubmit = async () => {
        try {
            const response = await deleteFunction(item.id); // Call the dynamic delete function

            if (response?.success) {
                notify('success', notifySuccess || 'Item removed successfully.');

                const modalEl = document.querySelector('#delete_item_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();
                
                // navigate(navigateUrl || '/', { replace: true }); // Navigate to the specified URL or default to /products
                navigate(0);
                
            } else {
                notify('error', notifyError || 'Error occurred during deletion.');
            }
        } catch (error) {
            notify('error', notifyError || 'Error occurred during deletion.');
            console.error('Product removal failed:', error);
        }
    };

    return (
        <div className="modal p-14" data-modal="true" id="delete_item_modal">
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
                <div className="modal-body p-0 pb-5">
                    <h3 className="text-lg font-medium text-gray-900 text-center my-6">
                        <i className="ki-solid ki-trash-square text-7xl text-red-500"></i>
                    </h3>

                    <div className="text-2sm text-center text-gray-700 mb-2">
                        {modalPrompt}
                    </div>

                    <div className="text-2sm text-center font-bold text-gray-700 mb-6">
                        {item.name}
                    </div>

                    <div className="flex justify-center items-center gap-4">
                        <button className="btn btn-light" data-modal-dismiss="true">
                            Cancel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleSubmit}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeleteModal;
