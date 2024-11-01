// src/components/LoginForm/LoginForm.tsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Slide, toast, ToastContainer } from "react-toastify";

const API_URL = 'https://api.renoxpert.my/api/';

const OTPVerifyPageV2: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const [mobile, setMobile] = useState<string | null>(null);
    const [form, setForm] = useState();

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
    }, [state]);

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

    const handleSubmit = async (e: React.FormEvent) => {
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
                mobH: state.mobH,
                otp_code: code
            };

            const response = await axios.post(`${API_URL}sms-otp/verify/login`, requestBody); // Add your API endpoint here

            console.log(response);

            if (response.data.status === 'verified') {
                localStorage.setItem('guest_token', response.data.guest_token);
                navigate(`/owner/order/overview/id/${state.orderId}`);
            } else {
                console.log('Invalid');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    const handleResend = async () => {
        try {
            const response = await axios.post(`${API_URL}sms-otp/request/${state.mobH}`);

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

    const mobileForm = (
        <div className="card max-w-[380px] w-full">
            <form className="card-body flex flex-col gap-5 p-10" onSubmit={handleSubmit}>
            </form>
        </div>
    );

    const otpForm = (
        <div className="card max-w-[380px] w-full">
            <form className="card-body flex flex-col gap-5 p-10" onSubmit={handleSubmit}>
                <img src='/public/media/illustrations/34.svg' className="dark:hidden h-20 mb-2" alt="" />
                <img src='/media/illustrations/34-dark.svg' className="light:hidden h-20 mb-2" alt="" />

                <div className="text-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-5">Verify your phone</h3>
                    <div className="flex flex-col">
                        <span className="text-2sm text-gray-700 mb-1.5">Enter the verification code we sent to</span>
                        <a href="#" className="text-sm font-medium text-gray-900">****** {state.mobileLast}</a>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-input-${index}`}
                            type="text"
                            className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity size-10 shrink-0 px-0 text-center"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            maxLength={1}
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

                <button className="btn btn-primary flex justify-center grow" type="submit">Continue</button>
            </form>
        </div>
    )

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
                {state ? otpForm : mobileForm}
            </div>

            <ToastContainer />
        </>
    );
};

export default OTPVerifyPageV2;
