// src/pages/User/AddOwner.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../../types";
import { addUser } from "../../services/api";
import { Slide, toast } from "react-toastify";
import ClipboardJS from "clipboard";
import { useUser } from "../../context/UserContext";

const countryOptions = [
    { code: '60', name: 'Malaysia', flag: '/public/media/flags/malaysia.svg' },
    { code: '65', name: 'Singapore', flag: '/public/media/flags/singapore.svg' },
];

function AddOwner() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name_first: '',
        name_last: '',
        email: '',
        type: '',
        country_code: '60',
        phone: ''
    });

    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

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

    const handleBackClick = () => {
        navigate('/users');
    }

    useEffect(() => {
        document.title = "Add User | RenoXpert";

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleChangeCountryCode = (countryCode: string) => {
        setFormData((prevData) => ({
            ...prevData,
            country_code: countryCode
        }))
    }

    const handleReset = () => {
        setFormData({ name: '', email: '', type: 'staff', phone: '' });
        setNewPassword('');
    };

    const handleSubmit = async () => {
        if (!formData.name_first || !formData.name_last || !formData.email || !formData.phone) {
            notify('error', 'Please fill in all fields.');
            return;
        }

        setIsLoading(true);
        setValidationErrors({}); // Reset previous errors
        try {
            const userData: User = {
                name_first: formData.name_first,
                name_last: formData.name_last,
                email: formData.email.trim() + '@belive.asia',
                type: formData.type,
                phone_no: formData.phone,
            };

            const response = await addUser(userData);

            if (response?.success) {
                setNewPassword(response.data.new_password);
                setFormData({
                    ...formData,
                    email: response.data[0].email
                });
                notify('success', 'User Created Successfully!');
            } else {
                console.log(response);

                setValidationErrors(response.data);
            }


        } catch (error) {
            console.log(error.response?.data?.data);
            setValidationErrors(error.response?.data?.data);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">Add User</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="card w-full flex justify-center items-center">
                    <div className="card-body py-6 flex flex-col items-center max-w-3xl w-full">
                        <div className="flex mb-4 w-full">
                            <span className="text-xl font-bold">User Detail</span>
                        </div>
                        <div className="flex mb-4 gap-4 w-full">
                            <div className="flex flex-col w-full">
                                <label className='mb-2 text-sm font-medium text-gray-900'>First Name</label>
                                <input
                                    className='input mb-2 w-full'
                                    placeholder='John'
                                    type='text'
                                    name='name_first'
                                    value={formData.name_first}
                                    onChange={handleChange}
                                />
                                {validationErrors.name_first && (
                                    <span className="text-red-500 text-sm">{validationErrors.name_first.join(', ')}</span>
                                )}
                            </div>
                            <div className="flex flex-col w-full">
                                <label className='mb-2 text-sm font-medium text-gray-900'>Last Name</label>
                                <input
                                    className='input mb-2 w-full'
                                    placeholder='Doe'
                                    type='text'
                                    name='name_last'
                                    value={formData.name_last}
                                    onChange={handleChange}
                                />
                                {validationErrors.name_last && (
                                    <span className="text-red-500 text-sm">{validationErrors.name_last.join(', ')}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>Preferred Name (Optional)</label>
                            <div className="flex items-center mb-2">
                                <input
                                    className='input mr-2'
                                    placeholder='Preferred Name'
                                    type='text'
                                    name='preferred_name'
                                    value={formData.preferred_name}
                                    onChange={handleChange}
                                />
                            </div>
                            {validationErrors.preferred_name && (
                                <span className="text-red-500 text-sm">{validationErrors.preferred_name.join(', ')}</span>
                            )}
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>Email</label>
                            <div className="flex items-center mb-2">
                                <input
                                    className='input mr-2'
                                    placeholder='email'
                                    type='text'
                                    name='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            {validationErrors.email && (
                                <span className="text-red-500 text-sm">{validationErrors.email.join(', ')}</span>
                            )}
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>IC</label>
                            <div className="flex items-center mb-2">
                                <input
                                    className='input mr-2'
                                    placeholder='xxxxxx-xx-xxxx'
                                    type='text'
                                    name='ic'
                                    value={formData.ic}
                                    onChange={handleChange}
                                />
                            </div>
                            {validationErrors.ic && (
                                <span className="text-red-500 text-sm">{validationErrors.ic.join(', ')}</span>
                            )}
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>Phone Number</label>

                            <div className="flex items-center mb-2">
                                <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click">
                                    <button className="dropdown-toggle btn btn-light mr-1">
                                        +{formData.country_code}
                                    </button>
                                    <div className="dropdown-content w-full max-w-56 py-2" data-dropdown-dismiss="true">
                                        <div className="menu menu-default flex flex-col w-full">
                                            {countryOptions.map((country) => (
                                                <div className="menu-item">
                                                    <button
                                                        type='button'
                                                        className="menu-link flex items-center text-center"
                                                        onClick={() => handleChangeCountryCode(country.code)}
                                                    >
                                                        <span className="menu-icon">
                                                            <img alt="" className="inline-block size-4 rounded-full" src={country.flag} />
                                                        </span>
                                                        <span className="menu-title">
                                                            {country.name} (+{country.code})
                                                        </span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <input
                                    className='input'
                                    placeholder='123456789'
                                    type='phone'
                                    name='phone'
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            {validationErrors.phone && (
                                <span className="text-red-500 text-sm">{validationErrors.phone.join(', ')}</span>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AddOwner;