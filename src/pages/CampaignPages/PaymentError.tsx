// src\pages\CampaignPages\PaymentError.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Loading from '../../components/Loading';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';

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
        const originateUrl = queryParams.get('originateUrl');

        if (originateUrl) {
            setErrorData({
                originateUrl: originateUrl,
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
        <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
            <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-12 w-auto mb-8" />

            <Card className="w-full max-w-md p-8 text-center">
                <span className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 grid place-items-center mx-auto">
                    <XCircle className="h-8 w-8" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-5">Payment didn't go through</h1>
                <p className="text-slate-500 mt-2">No charge was made. You can try again or contact support if the problem persists.</p>

                <div className="mt-6 rounded-2xl border border-slate-200 divide-y divide-slate-100 text-left text-sm">
                    <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Reference no</span><span className="font-semibold text-slate-900">{errorData.ref || 'N/A'}</span></div>
                    <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Code</span><span className="font-semibold text-slate-900">{errorData.code || 'N/A'}</span></div>
                </div>

                <Button fullWidth size="lg" className="mt-6" onClick={handleBackToOrigin}>
                    <ArrowLeft className="h-4 w-4" /> Try again
                </Button>
            </Card>
        </div>
    );
}

export default PaymentError;
