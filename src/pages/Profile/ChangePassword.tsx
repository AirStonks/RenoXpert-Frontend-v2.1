import { useState } from "react";
import { Slide, toast } from "react-toastify";
import { changePassword } from "../../services/api";

function ChangePassword() {
    const [formData, setFormData] = useState({
        old_pass: '',
        new_pass: '',
        confirm_pass: ''
    });
    
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

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
        if (!formData.old_pass || !formData.new_pass || !formData.confirm_pass) {
            notify('error', 'Please fill in all fields.');
            return;
        }

        setIsLoading(true);
        setValidationErrors({}); // Reset previous errors

        try {
            const response = await changePassword(formData);

            if (response?.success) {
                notify('success', 'Password has been succesfully reset.');
            } else {
                setValidationErrors(response.data);
            }

        } catch (error) {
            console.log(error.response?.data?.data);
            setValidationErrors(error.response?.data?.data);
            notify('error', 'Your current password is incorrect')
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    {/* <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button> */}
                    <span className="text-2xl font-bold text-gray-900">Change Password</span>
                </div>
            </div>


            <div className="flex flex-wrap gap-8 mb-8">
                <div className="card w-full flex justify-center items-center">
                    <div className="card-body py-6 flex flex-col items-center max-w-3xl w-full">
                        <div className="flex mb-4 w-full">
                            <span className="text-xl font-bold">Update Password</span>
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>Old Password</label>
                            <input
                                className='input mb-2 w-full'
                                placeholder=''
                                type='password'
                                name='old_pass'
                                value={formData.old_pass}
                                onChange={handleChange}
                            />
                            {validationErrors.old_pass && (
                                <span className="text-red-500 text-sm">{validationErrors.old_pass.join(', ')}</span>
                            )}
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>New Password</label>
                            <div className="flex items-center mb-2">
                                <input
                                    className='input mr-2'
                                    placeholder=''
                                    type='password'
                                    name='new_pass'
                                    value={formData.new_pass}
                                    onChange={handleChange}
                                />
                            </div>
                            {validationErrors.new_pass && (
                                <span className="text-red-500 text-sm">{validationErrors.new_pass.join(', ')}</span>
                            )}
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <label className='mb-2 text-sm font-medium text-gray-900'>Confirm Password</label>
                            <div className="flex items-center mb-2">
                                <input
                                    className='input'
                                    placeholder=''
                                    type='password'
                                    name='confirm_pass'
                                    value={formData.confirm_pass}
                                    onChange={handleChange}
                                />
                            </div>
                            {validationErrors.confirm_pass && (
                                <span className="text-red-500 text-sm">{validationErrors.confirm_pass.join(', ')}</span>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ChangePassword;