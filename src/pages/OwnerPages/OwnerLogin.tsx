// src/components/LoginForm/LoginForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import KTComponent from '../../metronic/core';
import OTPVerifyPage from '../OTPVerifyPage';
import { fetchExistsUser } from '../../services/ownerApi';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { staffLoginToOwner } from '../../services/auth';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { Building2, Cpu, DollarSign } from 'lucide-react';
import Loading from '../../components/Loading';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const CLIENT_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_CLIENT_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_CLIENT_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/owner/'
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
    { code: '61', name: 'Australia', flag: MEDIA_URL + 'flags/australia.svg' },
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

    const [mobile, setMobile] = useState<string>('');
    const [countryCode, setCountryCode] = useState<string>('60');
    const [showOtpForm, setShowOtpForm] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isStaffLogin, setIsStaffLogin] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [tokenLoginLoading, setTokenLoginLoading] = useState(false);

    const verifyToken = useCallback(async (token: string) => {
        try {
            const response = await axios.get(`${API_URL}user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setIsUnauthorized(false);
                localStorage.setItem('o_token', token);
                navigate(LOCAL_PATH_PREFIX);
                setTokenLoginLoading(false);
            } else {
                setIsUnauthorized(true);
            }
        } catch (error) {
            // If the request fails, token is invalid
            setIsUnauthorized(true);
            setTokenLoginLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        document.title = "Login | RenoXpert";
        KTComponent.init();
        setCountryCode('60');

        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        // Check if token parameter exists
        if (token) {
            // Verify the token and handle the result
            setTokenLoginLoading(true);
            verifyToken(token);
            return;
        }

    }, [location.search, location.state, verifyToken]);

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
                const redirectUrl = location.state?.from || searchParams.get('redirect') || LOCAL_PATH_PREFIX;
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
                navigate(CLIENT_URL);
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
            {tokenLoginLoading ? (
                <Loading />

            ) : isUnauthorized ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 w-full">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 animate-in fade-in duration-300 text-center">
                        <div className="flex justify-center mb-6">
                            <img className="h-12 max-w-none" src="/app/RenoExpert_logo-01.svg" alt="RenoXpert Logo" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h3>
                        <p className="text-gray-600 mb-6">
                            Your trusted partner for professional renovation services. We transform your space with quality craftsmanship and expert guidance.
                        </p>

                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <h4 className="text-lg font-semibold text-blue-900 mb-3">What We Offer</h4>
                            <div className="grid grid-cols-3 gap-3 text-sm text-blue-800">
                                <div className="flex flex-col items-center">
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                    Built-for-rental designs
                                </div>
                                <div className="flex flex-col items-center">
                                    <Cpu className="w-8 h-8 text-blue-600" />
                                    Integrated smart system
                                </div>
                                <div className="flex flex-col items-center">
                                    <DollarSign className="w-8 h-8 text-blue-600" />
                                    Enjoy Passive Income
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => window.open('https://wa.me/601156985313', '_blank')}
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.239-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                </svg>
                                Get touch with Sales Consultant
                            </button>

                            <p className="text-sm text-gray-500">
                                <strong>WhatsApp Number:</strong> +601156985313<br />
                            </p>
                        </div>
                    </div>
                </div>
            ) : !showOtpForm ? (
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

            <ToastContainer />
        </>
    );
};

export default OwnerLogin;
