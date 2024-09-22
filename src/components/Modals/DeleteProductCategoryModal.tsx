// src/components/Modals/DeleteProductCategoryModal.tsx

import { Slide, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { removeProductCategory } from '../../services/api';
import { KTModal } from '../../metronic/core';

interface DeleteProductCategoryModalProps {
    productCategory: { id: number, name: string } | null;
}

function DeleteProductCategoryModal({ productCategory }: DeleteProductCategoryModalProps) {
    const navigate = useNavigate();
    
    if (!productCategory) return null; // Return nothing if no product is selected

    const notify = () => toast.success("Product Category Removed Successfully!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: localStorage.getItem('theme'),
        transition: Slide,
    });

    const handleSubmit = async () => {
        try {
            const response = await removeProductCategory(productCategory.id);

            if (response?.success) {
                notify();

                const modalEl = document.querySelector('#delete_prod_cat_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                console.log(modal);
                

                modal.hide();
                
                navigate('/products/category'); // Navigate to /products on success
                window.location.href = '/products/category';
            } else {
                alert('Error: ' + (response?.message || 'Product remove failed.'));
            }
        } catch (error) {
            console.error('Product remove failed:', error);
        }
    };

    return (
        <div className="modal p-14" data-modal="true" id="delete_prod_cat_modal">
            <div className="modal-content modal-center-y max-w-[500px]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Remove Product Category</span>
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
                        Are you sure to permanently remove this product category:
                    </div>

                    <div className="text-2sm text-center font-bold text-gray-700 mb-6">
                        {productCategory.name}
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

export default DeleteProductCategoryModal;
