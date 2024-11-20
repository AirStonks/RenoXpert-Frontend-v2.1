// src\components\Modals\AddProductCategoryModal.tsx

import { useState } from "react";
import { Slide, toast } from "react-toastify";
import { KTModal } from "../../metronic/core";
import { DiscountFee } from "../../types";
import { createDiscountFee } from "../../services/api";

interface AddDiscountFeeModalProps {
    refreshTableFunction: () => void;  // Assuming this function type
  }

  
function AddDiscountFeeModal({ refreshTableFunction }: AddDiscountFeeModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'discount',
        method: 'byPercentage',
        value: '',
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
            const discountFeeData: DiscountFee = {
                name: formData.name,
                type: formData.type,
                amount: formData.method === 'byAmount' ? parseFloat(formData.value) : null, // Set amount based on method
                percentage: formData.method === 'byPercentage' ? parseFloat(formData.value) : null, // Set percentage based on method
            };
    
            const response = await createDiscountFee(discountFeeData);

            if (response?.success) {
                notify('success', "Discount/Fee Added Successfully!");

                // Close Modal
                const addDiscountFeeModalEl = document.querySelector('#add_discount_fee_modal') as HTMLElement;
                const addDiscountFeeModal = KTModal.getInstance(addDiscountFeeModalEl);

                addDiscountFeeModal.hide();

                refreshTableFunction();
            }

        } catch (error) {
            if (error.response?.status === 422) {
                notify('error', "Discount/Fee creation unsuccessful. Check the errors below.");
            } else {
                console.error('Discount/Fee creation failed:', error);
            }
        }
    };

    return (
        <div className="modal p-14" data-modal="true" id="add_discount_fee_modal">
            <div className="modal-content modal-center-y max-w-[600px]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Add New Discount/Fee</span>
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
                            Name
                        </label>
                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                            Define a name for this discount/fee
                        </span>
                        <input
                            className='input mb-2'
                            placeholder='Name'
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col mb-6">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Type
                        </label>
                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                            Define the type
                        </span>
                        <div className="flex gap-12">
                            <label className="form-label flex items-center gap-2.5 text-nowrap">
                                <input
                                    className="radio"
                                    name="type"
                                    type="radio"
                                    value="discount"
                                    checked={formData.type === 'discount'}
                                    onChange={handleChange}
                                />
                                Discount
                            </label>
                            <label className="form-label flex items-center gap-2.5 text-nowrap">
                                <input
                                    className="radio"
                                    name="type"
                                    type="radio"
                                    value="fee"
                                    checked={formData.type === 'fee'}
                                    onChange={handleChange}
                                />
                                Fee
                            </label>
                        </div>
                    </div>
                    <div className="flex flex-col mb-6">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Method
                        </label>
                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                            Choose a method of the discount/fee
                        </span>
                        <div className="flex gap-12">
                            <label className="form-label flex items-center gap-2.5 text-nowrap">
                                <input
                                    className="radio"
                                    name="method"
                                    type="radio"
                                    value="byPercentage"
                                    checked={formData.method === 'byPercentage'}
                                    onChange={handleChange}
                                />
                                By %
                            </label>
                            <label className="form-label flex items-center gap-2.5 text-nowrap">
                                <input
                                    className="radio"
                                    name="method"
                                    type="radio"
                                    value="byAmount"
                                    checked={formData.method === 'byAmount'}
                                    onChange={handleChange}
                                />
                                By Amount
                            </label>
                        </div>
                    </div>
                    <div className="flex flex-col mb-6">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Value
                        </label>
                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                            Set the discount/fee value based on selected type
                        </span>
                        <input
                            className='input mb-2'
                            placeholder='Value'
                            type='number'
                            name='value'
                            value={formData.value}
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

export default AddDiscountFeeModal;