import React, { useState, useEffect } from "react";
import axios from "axios";
import { Slide, toast, ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

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

const OTPVerifyPage: React.FC<{
    mobile: string,
    countryCode: string,
    handleSubmit: (mobile?: string, otp?: string[]) => Promise<void>,
    otp: string[],
    setOtp: React.Dispatch<React.SetStateAction<string[]>>
    setShowOtpForm: React.Dispatch<React.SetStateAction<boolean>>
}> = ({
    mobile,
    countryCode,
    handleSubmit,
    otp,
    setOtp,
    setShowOtpForm
}) => {
        const [error, setError] = useState<string | null>(null);
        const [countdown, setCountdown] = useState(5);
        const [canResend, setCanResend] = useState(false);
        const [loading, setLoading] = useState(false); // New loading state

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
            const handleRequestOTP = async () => {
                const response = await axios.post(`${API_URL}sms-otp/request/${countryCode}/${mobile}`);

                if (response.data.status === 'success') {
                    notify('success', 'OTP has been sent to the mobile no.');
                    setCountdown(5);
                    setCanResend(false);
                } else {
                    notify('error', 'Error while sending the OTP');
                }
            }

            const handleLocalOTP = () => {
                setCountdown(5);
                setCanResend(false);
            }

            import.meta.env.VITE_APP_ENV === "production" ? handleRequestOTP() : handleLocalOTP();

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
            if (/^[0-9]?$/.test(value)) {
                newOtp[index] = value;
                if (value && index < otp.length - 1) {
                    document.getElementById(`otp-input-${index + 1}`)?.focus();
                }
            } else if (value === '') {
                newOtp[index] = '';
                if (index > 0) {
                    document.getElementById(`otp-input-${index - 1}`)?.focus();
                }
            }
            setOtp(newOtp);
        };

        const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace' && otp[index] === '') {
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

        const onSubmit = async () => {
            try {
                setLoading(true); // Set loading state for submission
                setError(null); // Clear any previous errors
                await handleSubmit(mobile, otp); // Call the passed handleSubmit function
            } catch (error) {
                setError("Invalid OTP. Please try again."); // Set error message
                notify("error", "Invalid OTP. Please try again.");
            } finally {
                setLoading(false); // Clear loading state
            }
        };

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 w-full">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-in fade-in duration-300">
                    <div className="flex justify-center mb-6">
                        <img
                            src={`${MEDIA_URL}illustrations/34.svg`}
                            className="h-16 dark:hidden"
                            alt="Verification Illustration"
                        />
                        <img
                            src={`${MEDIA_URL}illustrations/34-dark.svg`}
                            className="h-16 hidden dark:block"
                            alt="Verification Illustration Dark"
                        />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Verify Your Phone</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                        Click <span className="font-medium text-gray-900">"Request OTP"</span> to receive the OTP code
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-4 flex flex-col">
                        <span className="font-medium text-gray-900">+{countryCode} {mobile}</span>
                        <button
                            className="text-blue-600 focus:ring-blue-500"
                            onClick={() => setShowOtpForm(false)}
                        >
                            Not you?
                        </button>
                    </p>

                    {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                    <div className="flex justify-center gap-2 mb-6">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-input-${index}`}
                                type="text"
                                className="w-12 h-12 text-center text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                maxLength={1}
                                inputMode="numeric"
                            />
                        ))}
                    </div>

                    <div className="flex justify-center items-center gap-4 mb-6">
                        {canResend ? (
                            <button
                                type="button"
                                onClick={handleResend}
                                className="text-blue-600 hover:underline text-sm font-medium"
                            >
                                Request OTP
                            </button>
                        ) : (
                            <span className="text-sm text-gray-500">
                                Didn't receive a code? ({countdown}s)
                            </span>
                        )}
                    </div>

                    <button
                        className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            } text-white`}
                        type="button"
                        onClick={onSubmit}
                        disabled={loading} // Disable button during loading
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg
                                    className="animate-spin h-5 w-5 mr-2 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                                    ></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            "Continue"
                        )}
                    </button>
                </div>

                <ToastContainer />
            </div>
        );
    };

export default OTPVerifyPage;