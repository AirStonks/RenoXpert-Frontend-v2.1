// src\components\Modals\AddProductCategoryModal.tsx

import { useEffect, useState } from "react";
import { Slide, toast } from "react-toastify";
import { Contact } from "../../types";
import { KTCollapse, KTModal } from "../../metronic/core";
import { createContact } from "../../services/api";

function CreateContactModal() {
    const [isOpen, setIsOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_no: '',
        alt_phone_no: '',
        race: '',
        gender: '',
        nationality: '',
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

    const handleSubmit = async () => {
        try {
            const contactData: Contact = {
                name: formData.name,
                email: formData.email,
                phone_no: formData.phone_no,
                alt_phone_no: formData.alt_phone_no,
                race: formData.race,
                gender: formData.gender,
                nationality: formData.nationality,
                description: formData.description,
            };

            const response = await createContact(contactData);

            if (response?.success) {
                notify('success', "Contact Created Successfully!");

                // Close Modal
                const element = document.querySelector('#create_contact_modal') as HTMLElement;
                const modal = KTModal.getInstance(element);

                modal.hide();
            }

        } catch (error) {
            if (error.response?.status === 422) {
                notify('error', "Contact creation unsuccessful. Check the errors below.");
            } else {
                console.error('Contact creation failed:', error);
            }
        }
    };

    useEffect(() => {
        KTCollapse.init();
    });

    return (
        <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="create_contact_modal">
            <div className="modal-content modal-center-y max-w-[600px] max-h-[95%]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Add New Contact</span>
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
                            Name
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='John Doe'
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Email
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='john@domain.com'
                            type='text'
                            name='email'
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Phone No.
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='0123456789'
                            type='text'
                            name='phone_no'
                            value={formData.phone_no}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col mb-6">
                        <label className='mb-2 text-sm font-medium text-gray-900'>
                            Description
                        </label>

                        <input
                            className='input mb-2'
                            placeholder=''
                            type='text'
                            name='description'
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        className="mb-4"
                        onClick={() => setIsOpen(!isOpen)}
                        data-collapse="#personal_detetail_content"
                    >
                        <div className="flex items-center">
                            <h2 className="text-lg text-gray-900 font-bold mr-4">Personal Detail</h2>
                            <i className={`ki-filled ${isOpen ? 'ki-up' : 'ki-down'} text-gray-900 text-md transition-transform duration-300`}></i>
                        </div>
                    </button>

                    <div className="transition-all duration-300 hidden" id="personal_detetail_content">
                        <div className="flex flex-col mb-4">
                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                Alternate Phone No
                            </label>

                            <input
                                className='input mb-2'
                                placeholder='0123456789'
                                type='text'
                                name='alt_phone_no'
                                value={formData.alt_phone_no}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="flex gap-6">
                            <div className="flex flex-col mb-4 w-full">
                                <label className='mb-2 text-sm font-medium text-gray-900'>
                                    Gender
                                </label>

                                <input
                                    className='input mb-2'
                                    placeholder='Female'
                                    type='text'
                                    name='gender'
                                    value={formData.gender}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex flex-col mb-4 w-full">
                                <label className='mb-2 text-sm font-medium text-gray-900'>
                                    Race
                                </label>

                                <input
                                    className='input mb-2'
                                    placeholder='Malay'
                                    type='text'
                                    name='race'
                                    value={formData.race}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                Nationality
                            </label>

                            <input
                                className='input mb-2'
                                placeholder='Malaysian'
                                type='text'
                                name='nationality'
                                value={formData.nationality}
                                onChange={handleChange}
                            />
                        </div>
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

export default CreateContactModal;