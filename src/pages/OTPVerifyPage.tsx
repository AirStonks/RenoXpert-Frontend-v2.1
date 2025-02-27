// src/components/LoginForm/LoginForm.tsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Slide, toast, ToastContainer } from "react-toastify";

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

const OTPVerifyPage: React.FC<{ mobile: string, countryCode: string, handleSubmit: (mobile?: string, otp?: string[]) => void, otp: string[], setOtp: React.Dispatch<React.SetStateAction<string[]>> }> = ({ 
    mobile, 
    countryCode, 
    handleSubmit, 
    otp, 
    setOtp 
}) => {

    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(true);

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

        // Start countdown
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanResend(true); // Allow resend after countdown
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Clean up on component unmount
    }, []);

    const handleChange = (index: number, value: string) => {
        const newOtp = [...otp];

        // Allow only numeric input
        if (/^[0-9]?$/.test(value)) {
            newOtp[index] = value;

            // Move focus to the next input if the current one is filled
            if (value && index < otp.length - 1) {
                document.getElementById(`otp-input-${index + 1}`)?.focus();
            }
        } else if (value === '') {
            // If backspace is pressed, clear the current input and move focus to the previous one
            newOtp[index] = '';
            if (index > 0) {
                document.getElementById(`otp-input-${index - 1}`)?.focus();
            }
        }

        setOtp(newOtp);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && otp[index] === '') {
            // Move focus to the previous input if the current one is empty and backspace is pressed
            if (index > 0) {
                document.getElementById(`otp-input-${index - 1}`)?.focus();
            }
        }
    };

    const handleResend = async () => {
        try {
            const response = await axios.post(`${API_URL}sms-otp/request/${countryCode}/${mobile}`);

            if (response.data.status === 'success') {
                notify('success', 'OTP has been sent to the mobile no.');
                setCountdown(60);
                setCanResend(false);
                setTimeout(() => {
                    const timer = setInterval(() => {
                        setCountdown(prev => {
                            if (prev <= 1) {
                                clearInterval(timer);
                                setCanResend(true);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                }, 500);
            } else {
                notify('error', 'Error while sending the OTP');
            }
        } catch (error) {
            notify('error', 'Error while sending the OTP');
        }
    };

    return (
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
            <div className="flex items-center justify-center grow bg-center bg-no-repeat page-bg">
                <div className="card max-w-[380px] w-full">
                    <div className="card-body flex flex-col gap-5 p-10">
                        <img src='/public/media/illustrations/34.svg' className="dark:hidden h-20 mb-2" alt="" />
                        <img src='/media/illustrations/34-dark.svg' className="light:hidden h-20 mb-2" alt="" />

                        <div className="text-center mb-2">
                            <h3 className="text-lg font-medium text-gray-900 mb-5">Verify your phone</h3>
                            <div className="flex flex-col">
                                <span className="text-2sm text-gray-700 mb-1.5">Enter the verification code we sent to</span>
                                {/* <a href="#" className="text-sm font-medium text-gray-900">****** {state.mobileLast}</a> */}
                                <span className="text-sm font-medium text-gray-900">+{countryCode} {mobile}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2.5">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-input-${index}`}
                                    type="text" // Changed from "number" to "text"
                                    className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity size-10 shrink-0 px-0 text-center"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    maxLength={1}
                                    inputMode="numeric" // Optional: Suggests numeric keyboard on mobile
                                />
                            ))}
                        </div>

                        {error && <div className="text-red-600 text-center">{error}</div>}

                        <div className="flex items-center justify-center mb-1.5">
                            {canResend && (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="btn btn-primary btn-outline text-sm">
                                    Request OTP
                                </button>
                            )}
                            {countdown > 0 && (
                                <span className="text-xs text-gray-700 me-1.5">
                                    Didn’t receive a code? ({countdown}s)
                                </span>
                            )}
                        </div>

                        <button
                            className="btn btn-primary flex justify-center grow"
                            type="button"
                            onClick={() => handleSubmit(mobile, otp)}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>

            <ToastContainer />
        </>
    );
};

export default OTPVerifyPage;
