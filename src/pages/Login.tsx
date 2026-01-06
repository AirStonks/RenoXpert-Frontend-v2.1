import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userLogin } from '../services/auth';
import KTComponent from '../metronic/core';
import { ToastContainer } from 'react-toastify';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';


interface LoginForm {
    email: string;
    password: string;
}

const Login: React.FC = () => {
    useEffect(() => {
        document.title = 'Login | RenoXpert';
        KTComponent.init();
    }, []);

    const [formData, setFormData] = useState<LoginForm>({ email: '', password: '' });
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

        const emailWithDomain = formData.email.trim() + '@belive.asia';

        try {
            const userData = await userLogin(emailWithDomain, formData.password);
            if (userData) {
                navigate(LOCAL_PATH_PREFIX + 'dashboard');
            }
        } catch (err: any) {
            console.error('Login error details:', err);
            // Show more specific error messages
            if (err.response?.status === 401) {
                setError('Invalid login credentials. Please check your email and password.');
            } else if (err.response?.status === 422) {
                const errors = err.response.data?.data || {};
                const errorMessages = Object.values(errors).flat();
                setError(errorMessages.length > 0 ? errorMessages[0] as string : 'Validation error. Please check your input.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Login failed. Please try again.');
            }
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
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Sign in to Staff Portal</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Login using your email and password</p>

                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="flex items-center gap-2">
                            <input
                                className="flex-1 border border-gray-300 rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="name"
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">@belive.asia</span>
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
                            className="checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
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

                {/* Social Login */}
            </div>

            <ToastContainer />
        </div >
    );
};

export default Login;