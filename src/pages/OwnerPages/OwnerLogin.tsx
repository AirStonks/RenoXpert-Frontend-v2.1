// src/components/LoginForm/LoginForm.tsx
import React, { useState } from 'react';
import { useEffect } from 'react';
import KTComponent from '../../metronic/core';
import OTPVerifyPage from '../OTPVerifyPage';
import { fetchExistsUser } from '../../services/ownerApi';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { staffLoginToOwner } from '../../services/auth';
import { Slide, toast } from 'react-toastify';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';
const IS_LOCAL = window.location.hostname === 'localhost';

const CLIENT_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_CLIENT_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_CLIENT_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/owner/'
                : null;

const STAFF_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_STAFF_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_STAFF_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/staff/'
                : null;

const VEN_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_VEN_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_VEN_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/staff/'
                : null;

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

// Country code options
const countryOptions = [
    { code: '60', name: 'Malaysia', flag: MEDIA_URL + 'flags/malaysia.svg' },
    { code: '65', name: 'Singapore', flag: MEDIA_URL + 'flags/singapore.svg' },
];

const OwnerLogin: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const staffToken = localStorage.getItem('token');

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
        KTComponent.init();
        setCountryCode('60');

        const searchParams = new URLSearchParams(location.search);
        const redirectUrl = location.state?.from || searchParams.get('redirect') || '/owner/home';
        console.log(redirectUrl);
    }, [location.search, location.state]);

    const [mobile, setMobile] = useState<string>('');
    const [countryCode, setCountryCode] = useState<string>('60');
    const [showOtpForm, setShowOtpForm] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isStaffLogin, setIsStaffLogin] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setMobile(value);
        setError(null);
    };

    const handleChangeCountryCode = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setCountryCode(value);
    };

    const isValidPhoneNumber = (number: string) => {
        const phoneRegex = /^\d{5,14}$/;
        return phoneRegex.test(number);
    };

    const handleRequestOtp = () => {
        if (!mobile) {
            setError('Please enter your mobile number.');
            return;
        }

        if (!isValidPhoneNumber(mobile)) {
            setError('Please enter a valid phone number (e.g., 0123456789).');
            return;
        }

        setShowOtpForm(true);
    };

    const handleToOtpVerify = async () => {
        if (!mobile) {
            setError('Please enter your mobile number.');
            return;
        }

        try {
            const response = await fetchExistsUser(countryCode, mobile);
            if (response.success) {
                handleRequestOtp();
            } else {
                setError('Phone number does not exists.');
            }
        } catch (error) {
            setError('Phone number does not exists.');
        }
    };

    const handleSubmitLogin = async () => {
        if (otp.some(digit => digit === '')) {
            setError("Please fill in all the digits.");
            return;
        } else {
            setError(null);
        }

        const code = otp.join('');

        try {
            const requestBody = {
                country_code: countryCode,
                mobile: mobile,
                otp_code: code
            };

            const response = await axios.post(`${API_URL}sms-otp/verify/login`, requestBody);

            if (response.data.status === 'verified') {
                localStorage.setItem('o_token', response.data.o_token);
                const searchParams = new URLSearchParams(location.search);
                const redirectUrl = location.state?.from || searchParams.get('redirect') || '/';
                navigate(redirectUrl);
            } else {
                console.log('Invalid');
                notify('error', 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            notify('error', 'Invalid OTP. Please try again.');
        }
    };

    const handleSubmitLoginAsStaff = async () => {
        try {
            const userData = await staffLoginToOwner(countryCode, mobile, passphrase);
            if (userData) {
                navigate('/owner');
            }
        } catch (err) {
            setError('Invalid user credentials. Please try again.');
            notify('error', 'Invalid user credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!showOtpForm ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 w-full">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-in fade-in duration-300">
                        <div className="flex justify-center mb-6">
                            <img className="h-12 max-w-none" src="/app/RenoExpert_logo-01.svg" alt="RenoXpert Logo" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Sign in to Owner Portal</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">Login using your phone number or email</p>

                        <div className="flex justify-center gap-4 mb-6">
                            <button className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                                Using Phone
                            </button>
                            <button className="flex-1 py-2 px-4 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed" disabled>
                                Using Email
                            </button>
                        </div>

                        <div className="space-y-4">
                            {staffToken && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        checked={isStaffLogin}
                                        onChange={() => setIsStaffLogin(!isStaffLogin)}
                                    />
                                    <span className="text-sm text-gray-700">Staff Login to Owner</span>
                                </label>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <div className="flex gap-2">
                                    <div className="relative w-24">
                                        {/* Custom display for selected country code and icon */}
                                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 text-sm cursor-pointer">
                                            <img
                                                src={countryOptions.find(c => c.code === countryCode)?.flag}
                                                alt=""
                                                className="h-4 w-4 rounded-full"
                                            />
                                            <span className="flex-1 text-center">+{countryCode}</span>
                                        </div>
                                        {/* Hidden select element for functionality */}
                                        <select
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            value={countryCode}
                                            onChange={handleChangeCountryCode}
                                        >
                                            {countryOptions.map((country) => (
                                                <option key={country.code} value={country.code}>
                                                    +{country.code} {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <input
                                        className="flex-1 border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="1234567890"
                                        type="tel"
                                        value={mobile}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            {isStaffLogin && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Passphrase</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        type="password"
                                        value={passphrase}
                                        onChange={(e) => setPassphrase(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <button
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                                type="button"
                                onClick={isStaffLogin ? handleSubmitLoginAsStaff : handleToOtpVerify}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : isStaffLogin ? 'Proceed' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <OTPVerifyPage
                    mobile={mobile}
                    countryCode={countryCode}
                    handleSubmit={handleSubmitLogin}
                    otp={otp}
                    setOtp={setOtp}
                    setShowOtpForm={setShowOtpForm}
                />
            )}
        </>
    );
};

export default OwnerLogin;
