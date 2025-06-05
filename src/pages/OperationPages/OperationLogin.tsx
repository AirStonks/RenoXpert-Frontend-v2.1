import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KTComponents from '../../metronic/core';
import { operationLogin } from '../../services/auth';
import { Slide, toast, ToastContainer } from 'react-toastify';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/op/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

interface LoginForm {
    mobile: string;
    password: string;
}

const OperationLogin: React.FC = () => {
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

    useEffect(() => {
        document.title = "Login | RenoXpert";
        KTComponents.init();
    }, []);

    const [formData, setFormData] = useState<LoginForm>({ mobile: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userData = await operationLogin(formData.mobile, formData.password);
            if (userData) {
                navigate(LOCAL_PATH_PREFIX + 'home');
            }
        } catch (err) {
            setError('Invalid user credentials. Please try again.');
            notify('error', 'Invalid user credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 w-full">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-in fade-in duration-300">
                <div className="flex justify-center mb-6">
                    <img className="h-12 max-w-none" src="/app/RenoExpert_logo-01.svg" alt="RenoXpert Logo" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Sign in to OP</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Login using your mobile number and password</p>

                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                        <div className="flex items-center gap-2">
                            <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click">
                                <button className="border border-gray-300 rounded-lg py-2 px-4 text-sm text-gray-700 bg-gray-100">
                                    +60
                                </button>
                                <div className="dropdown-content w-full max-w-56 py-2">
                                    <div className="menu menu-default flex flex-col w-full">
                                        <div className="menu-item">
                                            <button type='button' className="menu-link flex items-center text-center">
                                                <span className="menu-icon">
                                                    <img alt="" className="inline-block size-4 rounded-full" src={`${MEDIA_URL}flags/malaysia.svg`} />
                                                </span>
                                                <span className="menu-title">
                                                    Malaysia +(60)
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <input
                                className="flex-1 border border-gray-300 rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1234567890"
                                name="mobile"
                                type="tel"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            {/* <a href="#" className="text-sm text-blue-600 hover:underline">Forgot Password?</a> */}
                        </div>
                        <div className="relative">
                            <input
                                className="w-full border border-gray-300 rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            name="check"
                            value="1"
                        />
                        <span className="text-sm text-gray-700">Remember me</span>
                    </label>

                    <button
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>

            <ToastContainer />
        </div>
    );
};

export default OperationLogin;