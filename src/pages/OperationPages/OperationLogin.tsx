// src/components/LoginForm/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import KTComponents from '../../metronic/core';
import { operationLogin } from '../../services/auth';

interface LoginForm {
    mobile: string;
    password: string;
}

const OperationLogin: React.FC = () => {
    useEffect(() => {
        document.title = "Login | RenoXpert";
        KTComponents.init();
    }, []);
    const [formData, setFormData] = useState<LoginForm>({ mobile: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // React Router's useNavigate hook

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
                navigate('/op/home'); // Redirect to dashboard on successful userLogin
            }
        } catch (err) {
            setError('Invalid userLogin credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="absolute top-5 right-5">
                <button className="btn btn-icon btn-light dark:hidden" data-theme-toggle="true" data-tooltip="#theme_mode_dark">
                    <i className="ki-outline ki-sun">
                    </i>
                </button>
                <button className="btn btn-icon btn-light hidden dark:flex" data-theme-toggle="true" data-tooltip="#theme_mode_light">
                    <i className="ki-outline ki-moon">
                    </i>
                </button>
                <div className="tooltip" id="theme_mode_light">
                    Switch to Light mode
                </div>
                <div className="tooltip" id="theme_mode_dark">
                    Switch to Dark mode
                </div>
            </div>
            <div className="flex items-center justify-center grow bg-center bg-no-repeat page-bg">
                <form className="card max-w-[370px] w-full p-10 gap-5" onSubmit={handleSubmit}>
                    <div className="text-center mb-2.5">
                        <h3 className="text-lg font-medium text-gray-900 leading-none mb-2.5">
                            Sign in
                        </h3>
                        <div className="flex items-center justify-center font-medium">
                            <span className="text-2sm text-gray-700 me-1.5">
                                Login to Operation Portal
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 justify-center">
                        <label className="form-label font-normal text-gray-900">Email</label>
                        <div className="flex">
                            <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click">
                                <button className="dropdown-toggle btn btn-light mr-1">
                                    +60
                                </button>
                                <div className="dropdown-content w-full max-w-56 py-2">
                                    <div className="menu menu-default flex flex-col w-full">
                                        <div className="menu-item">
                                            <button type='button' className="menu-link flex items-center text-center">
                                                <span className="menu-icon">
                                                    <img alt="" className="inline-block size-4 rounded-full" src="/public/media/flags/malaysia.svg" />
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
                                className="input"
                                placeholder="1234567890"
                                name='mobile'
                                type="tel"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                tabIndex={1}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-1">
                            <label className="form-label font-normal text-gray-900">
                                Password
                            </label>
                            <a className="text-2sm link shrink-0" href="#">
                                Forgot Password?
                            </a>
                        </div>
                        <div className="input" data-toggle-password="true">
                            <input
                                placeholder="Enter Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                tabIndex={2}
                                required
                            />
                            <button className="btn btn-icon" data-toggle-password-trigger="true" type="button">
                                <i className="ki-filled ki-eye text-gray-500 toggle-password-active:hidden">
                                </i>
                                <i className="ki-filled ki-eye-slash text-gray-500 hidden toggle-password-active:block">
                                </i>
                            </button>
                        </div>

                    </div>
                    <label className="checkbox-group">
                        <input
                            className="checkbox checkbox-sm"
                            name="check" type="checkbox"
                            value="1" />
                        <span className="checkbox-label">Remember me</span>
                    </label>
                    <button
                        className="btn btn-primary flex justify-center grow"
                        type="submit"
                        disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </>
    );
};

export default OperationLogin;
