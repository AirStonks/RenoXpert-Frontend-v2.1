// src\components\Modals\AddProductCategoryModal.tsx

import { useEffect, useState } from "react";
import { Slide, toast } from "react-toastify";
import {  Property } from "../../types";
import { KTCollapse } from "../../metronic/core";
import { updateProperty } from "../../services/api";
import Loading from "../Loading";
import useFetchProperty from "../../hook/useFetchProperty";

interface EdiPropertyModalProps {
    propertyId: number | null;
}

function EditPropertyModal({ propertyId }: EdiPropertyModalProps) {
    const { propertyDetail, loading, error } = useFetchProperty(propertyId);
    const [isOpen, setIsOpen] = useState(false);

    let content;

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        street: '',
        postcode: '',
        city: '',
        state: '',
        description: '',
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

    useEffect(() => {
        KTCollapse.init();
        console.log('Property ID:', propertyId);

        if (propertyDetail) {
            setFormData({
                name: propertyDetail.name,
                address: propertyDetail.address,
                street: propertyDetail.street,
                postcode: propertyDetail.postcode,
                city: propertyDetail.city,
                state: propertyDetail.state,
                description: propertyDetail.description,
            });
        }
    }, [propertyId, propertyDetail]);

    if (!propertyId) return null; // Early return for null packageId

    const handleSubmit = async () => {
        try {
            const propertyData: Property = {
                id: propertyDetail.id,
                name: formData.name,
                address: formData.address,
                street: formData.street,
                postcode: formData.postcode,
                city: formData.city,
                state: formData.state,
                description: formData.description,
            };

            const response = await updateProperty(propertyData);

            if (response?.success) {
                notify('success', "Property Updated Successfully!");
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

        } catch (error) {
            if (error.response?.status === 422) {
                notify('error', "Property creation unsuccessful. Check the errors below.");
            } else {
                console.error('Property creation failed:', error);
            }
        }
    };

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!propertyDetail) {
        content = (
            <div className="modal-body p-6 scrollable overflow-y-auto">
                Contact not found
            </div>
        );
    } else {
        content = (
            <>
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Edit Contact</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross"></i>
                    </button>
                </div>
                <div className="modal-body p-6 scrollable overflow-y-auto">
                    <div className="flex flex-col mb-4">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Property Name
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='Setia Residence'
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Address
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='101, Old Klang Road'
                            type='text'
                            name='address'
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Street
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='Batu 3'
                            type='text'
                            name='street'
                            value={formData.street}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex gap-6">
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                City
                            </label>

                            <input
                                className='input mb-2'
                                placeholder='Kuala Lumpur'
                                type='text'
                                name='city'
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                Postcode
                            </label>

                            <input
                                className='input mb-2'
                                placeholder='58000'
                                type='text'
                                name='postcode'
                                value={formData.postcode}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col mb-4 w-full">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            State
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='WP Kuala Lumpur'
                            type='text'
                            name='state'
                            value={formData.state}
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
                            Update
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="edit_property_modal">
            <div className="modal-content modal-center-y max-w-[600px] max-h-[95%]">
                {content}
            </div>
        </div>
    );
}

export default EditPropertyModal;