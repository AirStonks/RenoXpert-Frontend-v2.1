// src/components/LoginForm/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { userLogin } from '../services/auth';
import KTComponent from '../metronic/core';
import { ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';

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

        const emailWithDomain = formData.email.trim() + '@belive.asia';

        try {
            const userData = await userLogin(emailWithDomain, formData.password);
            if (userData) {
                navigate('/dashboard'); // Redirect to dashboard on successful userLogin
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
                <form className="card max-w-[370px] w-full p-10 gap-2" onSubmit={handleSubmit}>
                    <div className="text-center mb-2.5">
                        <h3 className="text-lg font-medium text-gray-900 leading-none mb-2.5">
                            Sign in
                        </h3>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="flex flex-col gap-1 justify-center mb-2">
                        <label className="form-label font-normal text-gray-900">Email</label>
                        <div className="flex items-center">
                            <input
                                className="input mr-1"
                                placeholder="name"
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                tabIndex={1}
                                required
                            />
                            <div className='badge badge-lg text-md rounded-md cursor-default'>@belive.asia</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 mb-2">
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
                    <label className="checkbox-group mb-2">
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
                    <Link
                        to={'/vendor-login'}
                        className="btn btn-secondary flex justify-center grow"
                        type="submit">
                        Switch to Vendor login
                    </Link>
                </form>
            </div>

            <ToastContainer />
        </>
    );
};

export default Login;
