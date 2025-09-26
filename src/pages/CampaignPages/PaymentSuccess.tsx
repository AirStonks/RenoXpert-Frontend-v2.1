// src\pages\CampaignPages\PaymentSuccess.tsx

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../../components/Loading';
import { pdf } from '@react-pdf/renderer';
import ReceiptPDF from './ReceiptPDF';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

function PaymentSuccess() {
    const [paymentData, setPaymentData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        document.title = "Payment Successful | RenoXpert";
        // Parse query parameters from backend return URL
        const queryParams = new URLSearchParams(location.search);

        // Extract parameters from backend return URL format:
        // /campaign/{campaignId}/booking/payment/success?ref={bookingHash}&amount={amount}&originateUrl={originateUrl}&name={name}&bookingNumber={bookingNumber}&paymentDate={paymentDate}
        const ref = queryParams.get('ref');
        const amount = queryParams.get('amount');
        const originateUrl = queryParams.get('originateUrl');
        const name = queryParams.get('name');
        const bookingNumber = queryParams.get('bookingNumber');
        const paymentDate = queryParams.get('paymentDate');

        if (ref || amount || originateUrl || name || bookingNumber || paymentDate) {
            setPaymentData({
                ref: ref,
                amount: amount,
                originateUrl: originateUrl,
                name: name,
                bookingNumber: bookingNumber,
                paymentDate: paymentDate
            });
        }

        // Optionally clear the localStorage after retrieving if you had set it before
        localStorage.removeItem('data');
    }, [location]);

    // Function to format payment date from YYYYMMDDHHMMSS to readable format
    const formatPaymentDate = (dateString: string) => {
        if (!dateString || dateString.length !== 14) {
            return 'N/A';
        }

        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const hour = dateString.substring(8, 10);
        const minute = dateString.substring(10, 12);

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthName = monthNames[parseInt(month) - 1];

        return `${day} ${monthName} ${year} - ${hour}:${minute}`;
    };

    // Function to download receipt as PDF
    const downloadReceipt = async () => {
        if (!paymentData) return;

        try {
            // Generate PDF
            const blob = await pdf(<ReceiptPDF paymentData={paymentData} />).toBlob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt_${paymentData.bookingNumber || paymentData.ref || 'payment'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to text receipt if PDF generation fails
            const receiptContent = `
RENOXPERT - PAYMENT RECEIPT
============================

Booking Number: ${paymentData.bookingNumber || 'N/A'}
Customer Name: ${paymentData.name || 'N/A'}
Amount Paid: RM ${paymentData.amount ? Number(paymentData.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) : 'N/A'}
Payment Date: ${formatPaymentDate(paymentData.paymentDate)}

Status: Payment Successful

Thank you for choosing RenoXpert!

---
Generated on: ${new Date().toLocaleString()}
            `.trim();

            const blob = new Blob([receiptContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt_${paymentData.bookingNumber || paymentData.ref || 'payment'}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    };

    if (!paymentData) {
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

                {/* Success Animation */}
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Success Message */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Payment Successful!
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                        Your payment has been processed successfully
                    </p>
                    <p className="text-sm text-gray-500">
                        A confirmation email has been sent to your registered email address
                    </p>
                </div>

                {/* Payment Summary Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 w-full max-w-md">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Summary</h3>
                        <div className="w-16 h-1 bg-green-500 rounded-full mx-auto"></div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-xs text-gray-600 font-medium">Booking Number</span>
                            <span className="text-2xs text-gray-900 font-semibold">{paymentData.bookingNumber || 'N/A'}</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-xs text-gray-600 font-medium">Customer Name</span>
                            <span className="text-2xs text-gray-900 font-semibold">{paymentData.name || 'N/A'}</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-xs text-gray-600 font-medium">Amount Paid</span>
                            <span className="text-2xs font-bold text-green-600">
                                RM {paymentData.amount ? Number(paymentData.amount).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) : 'N/A'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-600 font-medium">Payment Date</span>
                            <span className="text-2xs text-gray-900 font-semibold">
                                {formatPaymentDate(paymentData.paymentDate)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Download Receipt Button */}
                <div className="w-full max-w-md">
                    <button
                        onClick={downloadReceipt}
                        className="btn btn-lg btn-primary rounded-xl shadow-lg w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF Receipt
                    </button>
                </div>

                {/* Additional Information */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 mb-4">
                        Need help? Contact our sales team
                    </p>
                    <div className="flex justify-center space-x-6 text-sm">
                        <a href="mailto:sales@renoxpert.my" className="text-blue-600 hover:text-blue-800 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email Support
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;
