// src\components\Modals\AddProductCategoryModal.tsx

import { useEffect, useState } from "react";
import { Slide, toast } from "react-toastify";
import { Contact } from "../../types";
import { KTCollapse } from "../../metronic/core";
import { updateContact } from "../../services/api";
import useFetchContact from "../../hook/useFetchContact";
import Loading from "../Loading";

interface EdiContactModalProps {
    contactId: number | null;
}

function EditContactModal({ contactId }: EdiContactModalProps) {
    const { contactDetail, loading, error } = useFetchContact(contactId);
    const [isOpen, setIsOpen] = useState(false);

    let content;

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

    useEffect(() => {
        KTCollapse.init();
        console.log('Contact ID:', contactId);

        if (contactDetail) {
            setFormData({
                name: contactDetail.name,
                email: contactDetail.email,
                phone_no: contactDetail.phone_no,
                alt_phone_no: contactDetail.alt_phone_no,
                race: contactDetail.race,
                gender: contactDetail.gender,
                nationality: contactDetail.nationality,
                description: contactDetail.description,
            });
        }
    }, [contactId, contactDetail]);

    if (!contactId) return null; // Early return for null packageId

    const handleSubmit = async () => {
        try {
            const contactData: Contact = {
                id: contactDetail.id,
                name: formData.name,
                email: formData.email,
                phone_no: formData.phone_no,
                alt_phone_no: formData.alt_phone_no,
                race: formData.race,
                gender: formData.gender,
                nationality: formData.nationality,
                description: formData.description,
            };

            const response = await updateContact(contactData);

            if (response?.success) {
                notify('success', "Contact Updated Successfully!");
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

        } catch (error) {
            if (error.response?.status === 422) {
                notify('error', "Contact creation unsuccessful. Check the errors below.");
            } else {
                console.error('Contact creation failed:', error);
            }
        }
    };

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!contactDetail) {
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
                            Name
                        </label>

                        <input
                            className='input mb-2'
                            placeholder='Joe Doe'
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
                            placeholder='joe@domain.com'
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
                            Update
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="edit_contact_modal">
            <div className="modal-content modal-center-y max-w-[600px] max-h-[95%]">
                {content}
            </div>
        </div>
    );
}

export default EditContactModal;