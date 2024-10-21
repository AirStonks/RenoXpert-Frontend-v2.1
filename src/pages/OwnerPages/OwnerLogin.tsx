// src/components/LoginForm/LoginForm.tsx
import React, { useState } from 'react';
import { useEffect } from 'react';
import KTComponent from '../../metronic/core';
import OTPVerifyPage from '../OTPVerifyPage';

const OwnerLogin: React.FC = () => {

    useEffect(() => {
        KTComponent.init();
        setCountryCode('+60');
    }, []);

    const [mobile, setMobile] = useState<string>('');
    const [countryCode, setCountryCode] = useState<string>('+60');
    const [showOtpForm, setShowOtpForm] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setMobile(value);
        setError(null); // Clear error when user starts typing
    };

    const isValidPhoneNumber = (number: string) => {
        // Regex to match a 10-digit phone number starting with 0
        const phoneRegex = /^\d{9,14}$/;
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

    const handleButtonClick = () => {
        handleRequestOtp();
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
                                onClick={handleButtonClick}>
                                Next
                            </button>

                        </form>

                    </div>
                </>

            ) : (
                <OTPVerifyPage mobile={mobile} countryCode={countryCode} />
            )}
        </>
    );
};

export default OwnerLogin;
