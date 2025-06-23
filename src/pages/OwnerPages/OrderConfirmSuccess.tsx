import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

export default function OrderConfirmSuccess() {
    const [isVisible, setIsVisible] = useState(false)
    const [pulseAnimation, setPulseAnimation] = useState(false)
    const location = useLocation();
    const navigate = useNavigate();

    // Get query parameters using URLSearchParams
    const isSuccess = new URLSearchParams(window.location.search).get("success") !== null;
    const body = location.state?.body;

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        // Trigger pulse animation for success state
        if (isSuccess) {
            const pulseTimer = setTimeout(() => {
                setPulseAnimation(true);
            }, 800);
            return () => {
                clearTimeout(timer);
                clearTimeout(pulseTimer);
            };
        }

        return () => clearTimeout(timer);
    }, [isSuccess]);

    const handleRedirect = () => {
        navigate(LOCAL_PATH_PREFIX + 'order/overview/id/' + body?.order_id)
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">

            {/* Main Content Card */}
            <div
                className={`w-full max-w-sm mx-auto mt-16 mb-8 transform transition-all duration-700 ease-out
                    ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}`}
            >
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    {/* Header Section */}
                    <div
                        className={`px-8 pt-12 pb-8 text-center 
                            ${isSuccess
                                ? "bg-gradient-to-b from-green-50/80 to-transparent"
                                : "bg-gradient-to-b from-red-50/80 to-transparent"
                            }
                        `}
                    >
                        {/* Icon Container */}
                        <div
                            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transform transition-all duration-500 ease-out ${isSuccess
                                ? `bg-green-100/80 ${pulseAnimation ? "animate-pulse" : ""}`
                                : "bg-red-100/80"} 
                                ${isVisible ? "rotate-0" : "rotate-45"}
                            `}
                        >
                            {isSuccess ? (
                                <svg
                                    className={` w-12 h-12 text-green-600 transform transition-all duration-500 ease-out delay-300 
                                        ${isVisible ? "scale-100" : "scale-0"}
                                    `}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                        className={`${isVisible ? "animate-[draw_0.5s_ease-out_0.5s_forwards]" : ""}`}
                                        style={{
                                            strokeDasharray: "20",
                                            strokeDashoffset: isVisible ? "0" : "20",
                                        }}
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className={`w-12 h-12 text-red-600 transform transition-all duration-500 ease-out delay-300 
                                        ${isVisible ? "scale-100" : "scale-0"}
                                    `}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>

                        {/* Title */}
                        <h1
                            className={`text-2xl font-bold mb-3 transform transition-all duration-500 ease-out delay-200
                                ${isSuccess ? "text-green-800" : "text-red-800"}
                                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                            `}
                        >
                            {isSuccess ? "Quotation Confirmed!" : "Payment Failed"}
                        </h1>

                        {/* Subtitle */}
                        <p
                            className={`text-base leading-relaxed transform transition-all duration-500 ease-out delay-300
                                ${isSuccess ? "text-green-700" : "text-red-700"}
                                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                            `}
                        >
                            {isSuccess
                                ? "Thank you for choosing RenoXpert! Your quotation has been successfully processed."
                                : "We encountered an issue processing your payment. Please try again."}
                        </p>
                    </div>

                    {/* Details Section */}
                    <div className="px-8 py-6 bg-white/50">
                        <div
                            className={`space-y-4 transform transition-all duration-500 ease-out delay-400 
                                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                            `}
                        >
                            {isSuccess ? (
                                <>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 font-medium">Quotation No.</span>
                                        <span className="text-gray-900 font-semibold">#{body?.quotation_no || '-'}</span>
                                    </div>
                                    {/* <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 font-medium">Estimated Delivery</span>
                                        <span className="text-gray-900 font-semibold">3-5 business days</span>
                                    </div> */}
                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">
                                            If there are any questions or concerns, please don&apos;t hesitate to contact us.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-red-50/80 rounded-2xl p-4 border border-red-100">
                                        <h3 className="font-semibold text-red-800 mb-2">What happened?</h3>
                                        <p className="text-sm text-red-700">
                                            Your payment could not be processed. This might be due to insufficient funds, expired card, or
                                            network issues.
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">Need help? Contact our support team for assistance.</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-8 pb-8">
                        <div
                            className={`space-y-3 transform transition-all duration-500 ease-out delay-500
                                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                            `}
                        >
                            {isSuccess ? (
                                <>
                                    <button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl"
                                        onClick={handleRedirect}
                                    >
                                        View Detail
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl">
                                        Try Again
                                    </button>
                                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 active:scale-95">
                                        Contact Support
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Elements */}
                {isSuccess && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className={`absolute w-2 h-2 bg-green-400 rounded-full animate-bounce opacity-30
                                    ${isVisible ? "animate-[float_3s_ease-in-out_infinite]" : "opacity-0"}
                                `}
                                style={{
                                    left: `${Math.random() * 70 + 10}%`, // Random between 10% and 90%
                                    top: `${Math.random() * 60 + 20}%`,  // Random between 20% and 80%
                                    animationDelay: `${Math.random() * 1}s`, // Random between 0s and 1s
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Safe Area */}
            <div className="fixed bottom-0 left-0 right-0 h-8 bg-white/80 backdrop-blur-xl"></div>
        </div>
    )
}
