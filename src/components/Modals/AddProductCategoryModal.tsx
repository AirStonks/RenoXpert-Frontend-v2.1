// src\components\Modals\AddProductCategoryModal.tsx

import { useState } from "react";
import { Slide, toast } from "react-toastify";
import { KTModal } from "../../metronic/core";
import { addPMCategory } from "../../services/api";
import { PMCategory } from "../../types";

function AddProductCategoryModal() {
    const [formData, setFormData] = useState({
        categoryName: '',
        categoryDesc: '',
    });

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            const categoryData: PMCategory = {
                name: formData.categoryName,
                description: formData.categoryDesc,
            };

            const response = await addPMCategory(categoryData);

            if (response?.success) {
                notify('success', "Category Added Successfully!");
                
                // Close Modal
                const addProdCatModalEl = document.querySelector('#add_prod_cat_modal') as HTMLElement;
                const addProdCatModal = KTModal.getInstance(addProdCatModalEl);

                addProdCatModal.hide();
            }

        } catch (error) {
            if (error.response?.status === 422) {
                notify('error', "Product creation unsuccessful. Check the errors below.");
            } else {
                console.error('Product creation failed:', error);
            }
        }
    };

    return (
        <div className="modal p-14" data-modal="true" id="add_prod_cat_modal">
            <div className="modal-content modal-center-y max-w-[600px]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Add New Category</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross"></i>
                    </button>
                </div>
                <div className="modal-body p-4 pb-5">
                    <div className="flex flex-col mb-6">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Category Name
                        </label>

                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                            Define a name for this product category
                        </span>

                        <input
                            className='input mb-2'
                            placeholder='Product Category name'
                            type='text'
                            name='categoryName'
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col mb-6">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Category Description (Optional)
                        </label>

                        <span className="text-xs text-gray-600 tracking-wide mb-2">

                        </span>

                        <input
                            className='input mb-2'
                            placeholder='Description'
                            type='text'
                            name='categoryDesc'
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="modal-footer justify-end">
                    <div className="flex gap-4">
                        <button className="btn btn-light" data-modal-dismiss="true">
                            Cancel
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={handleSubmit}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddProductCategoryModal;