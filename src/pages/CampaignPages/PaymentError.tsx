// src\pages\CampaignPages\PaymentError.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Loading from '../../components/Loading';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

function PaymentError() {
    const [errorData, setErrorData] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Payment Failed | RenoXpert";
        // Parse query parameters from backend return URL
        const queryParams = new URLSearchParams(location.search);
        
        // Extract parameters from backend return URL format:
        // /campaign/{campaignId}/booking/payment/declined?ref={bookingHash}?originateUrl={originateUrl}?amount={amount}
        const ref = queryParams.get('ref');
        const originateUrl = queryParams.get('originateUrl');
        const code = queryParams.get('code');

        if (ref || originateUrl) {
            setErrorData({
                ref: ref,
                originateUrl: originateUrl,
                code: code
            });
        }

        // Optionally clear the localStorage after retrieving if you had set it before
        localStorage.removeItem('errorData');
    }, [location]);

    const handleBackToOrigin = () => {
        if (errorData?.originateUrl) {
            // If originateUrl is provided, navigate to it
            window.location.href = errorData.originateUrl;
        } else {
            // Fallback to home or previous page
            navigate(-1);
        }
    };

    if (!errorData) {
        return <Loading />; // Show loading state if data is not yet available
    }

    return (
        <div className="container-fluid" id="content_container">
            <div className="flex flex-col items-center justify-center min-h-[95vh] py-8">
                {/* Logo */}
                <div className="mb-8">
                    <img 
                        src="/app/RenoExpert_logo-01.svg" 
                        alt="RenoXpert Logo" 
                        className="h-16 w-auto"
                    />
                </div>

                {/* Error Animation */}
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Error Message */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Payment Failed
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                        Your payment could not be processed
                    </p>
                    <p className="text-sm text-gray-500">
                        Please try again or contact support if the problem persists
                    </p>
                </div>

                {/* Payment Details Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 w-full max-w-md">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Response Details</h3>
                        <div className="w-16 h-1 bg-red-500 rounded-full mx-auto"></div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-xs text-gray-600 font-medium">Reference No</span>
                            <span className="text-2xs text-gray-900 font-semibold">{errorData.ref || 'N/A'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-600 font-medium">Code</span>
                            <span className="text-2xs text-gray-900 font-semibold">{errorData.code || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="w-full max-w-md">
                    <button
                        onClick={handleBackToOrigin}
                        className="btn btn-lg btn-primary rounded-xl shadow-lg w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Previous Page
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentError;
