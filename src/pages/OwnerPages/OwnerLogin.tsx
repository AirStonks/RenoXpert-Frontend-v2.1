// src/components/LoginForm/LoginForm.tsx
import React, { useState } from 'react';
import { useEffect } from 'react';
import KTComponent from '../../metronic/core';
import OTPVerifyPage from '../OTPVerifyPage';
import { fetchExistsUser } from '../../services/ownerApi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://api.renoxpert.my/api/';

const OwnerLogin: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Login | RenoXpert";
        KTComponent.init();
        setCountryCode('+60');
    }, []);

    const [mobile, setMobile] = useState<string>('');
    const [countryCode, setCountryCode] = useState<string>('+60');
    const [showOtpForm, setShowOtpForm] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setMobile(value);
        setError(null); // Clear error when user starts typing
    };

    const isValidPhoneNumber = (number: string) => {
        // Regex to match a 10-digit phone number starting with 0
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

        // Simulate requesting OTP
        setShowOtpForm(true);
    };

    const handleToOtpVerify = async () => {
        
        if (!mobile) {
            setError('Please enter your mobile number.');
            return;
        }

        try {
            const response = await fetchExistsUser(mobile);

            if (response.success) {
                handleRequestOtp();
            } else {
                setError('Phone number does not exists.');
            }
        } catch (error) {
            setError('Phone number does not exists.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        console.log('yes');
        
        e.preventDefault(); // Prevent default form submission

        // Check for missing inputs
        if (otp.some(digit => digit === '')) {
            setError("Please fill in all the digits.");
            return; // Stop submission if there are missing inputs
        } else {
            setError(null); // Clear any previous error messages
        }

        const code = otp.join(''); // Combine the array into a string

        try {
            const requestBody = {
                mobile: mobile,
                otp_code: code
            };

            const response = await axios.post(`${API_URL}sms-otp/verify/login`, requestBody); // Add your API endpoint here

            console.log(response);

            if (response.data.status === 'verified') {
                localStorage.setItem('o_token', response.data.o_token);
                navigate(`/owner/home`);
            } else {
                console.log('Invalid');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    return (
        <>
            {!showOtpForm ? (
                <>
                    <div className="absolute top-5 right-5">
                        <button className="btn btn-icon btn-light dark:hidden" data-theme-toggle="true" data-tooltip="#theme_mode_dark">
                            <i className="ki-outline ki-sun"></i>
                        </button>
                        <button className="btn btn-icon btn-light hidden dark:flex" data-theme-toggle="true" data-tooltip="#theme_mode_light">
                            <i className="ki-outline ki-moon"></i>
                        </button>
                        <div className="tooltip" id="theme_mode_light">Switch to Light mode</div>
                        <div className="tooltip" id="theme_mode_dark">Switch to Dark mode</div>
                    </div>
                    <div className="flex flex-col items-center justify-center grow bg-center bg-no-repeat page-bg">
                        <img className="default-logo min-h-[22px] h-[52px] max-w-none mb-6" src="/app/RenoExpert_logo-01.svg"></img>
                        <form className="card max-w-[370px] w-full p-10 gap-5">
                            <div className="text-center mb-2.5">
                                <h3 className="text-lg font-medium text-gray-900 leading-none mb-2">
                                    Sign in
                                </h3>
                                <div className="flex items-center justify-center font-medium mb-3">
                                    <span className="text-2sm text-gray-700 me-1.5">
                                        Login to Owner Portal
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <a className="btn btn-light btn-sm justify-center" href="#">
                                        Using Phone
                                    </a>
                                    <a className="btn btn-light btn-sm justify-center disabled" href="#">
                                        Using Email
                                    </a>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="form-label font-normal text-gray-900">Phone Number</label>
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
                                        type="tel"
                                        value={mobile}
                                        onChange={handleInputChange}
                                        tabIndex={1}
                                        required
                                    />
                                </div>

                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>
                            <button
                                className="btn btn-primary flex justify-center grow"
                                type="button"
                                onClick={handleToOtpVerify}
                            >
                                Next
                            </button>

                        </form>

                    </div>
                </>

            ) : (
                <OTPVerifyPage
                    mobile={mobile}
                    countryCode={countryCode}
                    handleSubmit={handleSubmit}
                    otp={otp}
                    setOtp={setOtp} // Pass down the setter function
                />
            )}
        </>
    );
};

export default OwnerLogin;
