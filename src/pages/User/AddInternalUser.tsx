// src/pages/User/AddUser.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../../types";
import { addUser } from "../../services/api";
import { Slide, toast } from "react-toastify";
import ClipboardJS from "clipboard";
import { useUser } from "../../context/UserContext";

function AddInternalUser() {
    const navigate = useNavigate();

    const { currentUser, loading, error } = useUser();

    const [formData, setFormData] = useState({
        name_first: '',
        name_last: '',
        email: '',
        type: '',
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
        document.title = "Add Internal User | RenoXpert";

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
                country_code: '60'
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
                console.log(response.data);

                setValidationErrors(response.data);
            }


        } catch (error) {
            setValidationErrors(error.response?.data?.data);
        } finally {
            setIsLoading(false);
        }
    }

    const renderUserDetails = () => (
        <div className="flex flex-wrap gap-8 mb-8">
            <div className="card w-full flex justify-center items-center">
                <div className="card-body py-6 flex flex-col items-center max-w-3xl w-full">
                    <div className="flex flex-col mb-6 w-full">
                        <span className="text-2xl font-bold">
                            Account Created Successfully
                        </span>

                    </div>
                    <div className="flex flex-col w-full">
                        <div className="flex badge text-sm badge-success badge-outline gap-2 items-center">
                            <i className="ki-filled ki-information-2 text-warning text-lg" />
                            <span className="">An email has been sent to associated email, please ask the user to check their email.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderForm = () => (
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
                            <div className='badge badge-lg text-md rounded-md cursor-default'>@belive.asia</div>
                        </div>
                        {validationErrors.email && (
                            <span className="text-red-500 text-sm">{validationErrors.email.join(', ')}</span>
                        )}
                    </div>
                    <div className="flex flex-col mb-4 w-full">
                        <label className='mb-2 text-sm font-medium text-gray-900'>Phone Number</label>

                        <div className="flex items-center mb-2">
                            <div className='badge badge-lg text-md rounded-md cursor-default mr-2'>+60</div>
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
                    <div className="flex flex-col w-full">
                        <label className='mb-2 text-sm font-medium text-gray-900'>User Type/Role</label>
                        <div className="flex flex-col items-start gap-6">
                            {['staff', 'admin', 'super-admin'].map(role => (
                                <label
                                    key={role}
                                    className={`form-label flex items-center gap-3 ${role === 'super-admin' ? 'disabled' : ''}`}
                                >
                                    <input
                                        className="radio radio-sm"
                                        name="type"
                                        type="radio"
                                        checked={formData.type === role}
                                        value={role}
                                        onChange={handleChange}
                                        // Disable based on currentUser.type and the role being rendered
                                        disabled={
                                            (currentUser?.type === 'super-admin' && role === 'super-admin') ||
                                            (currentUser?.type === 'admin' && (role === 'super-admin' || role === 'admin')) ||
                                            (currentUser?.type === 'staff')
                                        }
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                                        <span className="text-xs text-gray-500">This is a description</span>
                                    </div>
                                </label>
                            ))}
                        </div>
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
    );


    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">Add Internal User</span>
                </div>
            </div>
            {newPassword ? renderUserDetails() : renderForm()}
        </>
    );
}

export default AddInternalUser;