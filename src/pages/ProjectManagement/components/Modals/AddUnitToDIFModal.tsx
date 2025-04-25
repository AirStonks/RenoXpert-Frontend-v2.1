import React, { useEffect, useState } from 'react';
import { Slide, toast } from 'react-toastify';
import { Property } from '../../../../types';
import { addDIForm, fetchProperties } from '../../../../services/api';
import Loading from '../../../../components/Loading';
import { KTModal } from '../../../../metronic/core/components/modal/modal';

interface Props {
    refetch: () => void;
}

interface FormData {
    property_id: string;
    owner_email: string
    block: string;
    floor: string;
    unit: string;
    bedrooms: string;
    bathrooms: string;
    inspectionType: string;
    isDISubmitted: string;
    submitted_at: string;
}


function AddUnitToDIFModal({ refetch }: Props) {
    const [formData, setFormData] = useState<FormData>({
        property_id: '',
        owner_email: '',
        block: '',
        floor: '',
        unit: '',
        bedrooms: '',
        bathrooms: '',
        inspectionType: 'By Belive',
        isDISubmitted: 'No',
        submitted_at: '',
    });
    const [properties, setProperties] = useState<Property[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        // Function to check if modal is open
        const checkModalVisibility = () => {
            const modal = document.getElementById('add-unit-modal');
            const isOpen = modal?.classList.contains('open');
            setIsModalOpen(!!isOpen);
        };

        // Initial check
        checkModalVisibility();

        // Add event listener for modal toggle
        const modalElement = document.getElementById('add-unit-modal');
        if (modalElement) {
            modalElement.addEventListener('modal:open', () => setIsModalOpen(true));
            modalElement.addEventListener('modal:close', () => setIsModalOpen(false));
        }

        // MutationObserver to detect class changes
        const observer = new MutationObserver(checkModalVisibility);
        if (modalElement) {
            observer.observe(modalElement, { attributes: true, attributeFilter: ['class', 'data-modal-open'] });
        }

        // Cleanup
        return () => {
            observer.disconnect();
            if (modalElement) {
                modalElement.removeEventListener('modal:open', () => setIsModalOpen(true));
                modalElement.removeEventListener('modal:close', () => setIsModalOpen(false));
            }
        };
    }, []);

    useEffect(() => {
        // Fetch properties only when modal is open and properties haven't been fetched yet
        const getProperties = async () => {
            if (isModalOpen && properties.length === 0) {
                setIsLoading(true);
                try {
                    const data = await fetchProperties('', 6);
                    setProperties(data.data);
                } catch (error) {
                    console.error('Failed to fetch properties:', error);
                    notify('error', 'Failed to load properties');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        getProperties();
    }, [isModalOpen, properties.length]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Reset submitted_at if isDISubmitted changes to 'No'
            ...(name === 'isDISubmitted' && value === 'No' ? { submitted_at: '' } : {}),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Prepare data with converted types
            const submitData = {
                property_id: parseInt(formData.property_id),
                owner_email: formData.owner_email, // Include new field
                block: formData.block,
                floor: formData.floor,
                unit: formData.unit,
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                inspectionType: formData.inspectionType,
                isDISubmitted: formData.isDISubmitted === 'Yes',
                submitted_at: formData.isDISubmitted === 'Yes' ? formData.submitted_at : null,
            };

            const response = await addDIForm(submitData);

            if (response?.success) {
                notify('success', 'Defect Inspection Unit Added Successfully!');
                refetch();

                const modalEl = document.querySelector('#add-unit-modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                modal.hide();
            }

            // Reset form
            setFormData({
                property_id: '',
                owner_email: '', // Reset new field
                block: '',
                floor: '',
                unit: '',
                bedrooms: '',
                bathrooms: '',
                inspectionType: 'By Belive',
                isDISubmitted: 'No',
                submitted_at: '',
            });
        } catch (error) {
            console.error('Failed to add unit:', error);
            notify('error', 'Failed to add unit');
        } finally {
            setIsLoading(false);
        }
    };


    // Check if all formData fields are non-empty
    const isFormValid = Object.entries(formData).every(([key, value]) => {
        // Skip submitted_at validation if isDISubmitted is 'No'
        if (key === 'submitted_at' && formData.isDISubmitted === 'No') {
            return true;
        }
        // Ensure all other fields are non-empty and non-null
        return value !== null && value !== '';
    });



    return (
        <>
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" id="add-unit-modal">
                <div className="modal-content modal-center-y max-w-xl max-h-[95%] bg-white rounded-lg shadow-xl">
                    <div className="modal-header py-4 px-5 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-lg text-gray-900 font-bold">Add Defect Inspection Unit</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross text-xl"></i>
                        </button>
                    </div>
                    <div className="modal-body p-8 rounded-xl overflow-y-auto scrollable-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Property Selection */}
                            <div className="relative">
                                <label
                                    htmlFor="property_id"
                                    className="block text-sm font-semibold text-gray-800 mb-2"
                                >
                                    Property
                                </label>
                                <div className="relative">
                                    <select
                                        id="property_id"
                                        name="property_id"
                                        value={formData.property_id}
                                        onChange={handleInputChange}
                                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:border-gray-300"
                                        required
                                    >
                                        <option value="">Select Property</option>
                                        {properties.map((property) => (
                                            <option key={property.id} value={property.id}>
                                                {property.name}
                                            </option>
                                        ))}
                                    </select>
                                    <svg
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Block, Floor, Unit, Bedrooms, Bathrooms Inputs */}
                            {formData.property_id && (
                                <div className="grid grid-cols-3 gap-6">
                                    {(['block', 'floor', 'unit'] as const).map((field) => (
                                        <div key={field} className="relative">
                                            <label
                                                htmlFor={field}
                                                className="block text-sm font-semibold text-gray-800 mb-2 capitalize"
                                            >
                                                {field}
                                            </label>
                                            <input
                                                id={field}
                                                type="text"
                                                name={field}
                                                value={formData[field]} // No error: field is now a valid key
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:border-gray-300"
                                                required
                                            />
                                        </div>
                                    ))}
                                    <div className="relative">
                                        <label
                                            htmlFor="bedrooms"
                                            className="block text-sm font-semibold text-gray-800 mb-2"
                                        >
                                            Bedrooms
                                        </label>
                                        <select
                                            id="bedrooms"
                                            name="bedrooms"
                                            value={formData.bedrooms}
                                            onChange={handleInputChange}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:border-gray-300"
                                            required
                                        >
                                            <option value="">Select Bedrooms</option>
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <option key={num} value={num}>
                                                    {num}
                                                </option>
                                            ))}
                                        </select>
                                        <svg
                                            className="absolute right-3 top-3/4 -translate-y-1/2 w-5 h-5 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                    <div className="relative">
                                        <label
                                            htmlFor="bathrooms"
                                            className="block text-sm font-semibold text-gray-800 mb-2"
                                        >
                                            Bathrooms
                                        </label>
                                        <select
                                            id="bathrooms"
                                            name="bathrooms"
                                            value={formData.bathrooms}
                                            onChange={handleInputChange}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:border-gray-300"
                                            required
                                        >
                                            <option value="">Select Bathrooms</option>
                                            {[1, 2, 3].map((num) => (
                                                <option key={num} value={num}>
                                                    {num}
                                                </option>
                                            ))}
                                        </select>
                                        <svg
                                            className="absolute right-3 top-3/4 -translate-y-1/2 w-5 h-5 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Owner Email Input */}
                            <div className="relative">
                                <label
                                    htmlFor="owner_email"
                                    className="block text-sm font-semibold text-gray-800 mb-2"
                                >
                                    Owner Email
                                </label>
                                <input
                                    id="owner_email"
                                    type="email"
                                    name="owner_email"
                                    value={formData.owner_email}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:border-gray-300"
                                    required
                                />
                            </div>

                            {/* Inspection Type Radio Buttons */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-3">
                                    Defect Inspection Type
                                </label>
                                <div className="flex space-x-6">
                                    {['By Belive', 'By Owner'].map((type) => (
                                        <label
                                            key={type}
                                            className="flex items-center space-x-2 cursor-pointer group"
                                        >
                                            <input
                                                type="radio"
                                                name="inspectionType"
                                                value={type}
                                                checked={formData.inspectionType === type}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 transition-colors duration-200"
                                                required
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                                {type}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* DI Submitted Radio Buttons */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-3">
                                    Is Defect Inspection Form Submitted to MO?
                                </label>
                                <div className="flex space-x-6">
                                    {['Yes', 'No'].map((option) => (
                                        <label
                                            key={option}
                                            className="flex items-center space-x-2 cursor-pointer group"
                                        >
                                            <input
                                                type="radio"
                                                name="isDISubmitted"
                                                value={option}
                                                checked={formData.isDISubmitted === option}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 transition-colors duration-200"
                                                required
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                                {option}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {formData.isDISubmitted === 'Yes' && (
                                <div className="relative">
                                    <label
                                        htmlFor="submitted_at"
                                        className="block text-sm font-semibold text-gray-800 mb-2"
                                    >
                                        When Submitted
                                    </label>
                                    <input
                                        id="submitted_at"
                                        type="date"
                                        name="submitted_at"
                                        value={formData.submitted_at}
                                        onChange={handleInputChange}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:border-gray-300"
                                        required
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    className="px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow-md"
                                    data-modal-dismiss="true"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-blue-300 disabled:cursor-not-allowed"
                                    disabled={!isFormValid}
                                >
                                    Add Unit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AddUnitToDIFModal;