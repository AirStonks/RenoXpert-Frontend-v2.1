// src\pages\CampaignPages\PaymentSuccess.tsx

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../../components/Loading';
import { pdf } from '@react-pdf/renderer';
import ReceiptPDF from './ReceiptPDF';
import { CheckCircle2, Download, Mail } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';

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
        const txnId = queryParams.get('txnId');
        const originateUrl = queryParams.get('originateUrl');
        const name = queryParams.get('name');
        const bookingNumber = queryParams.get('bookingNumber');
        const paymentDate = queryParams.get('paymentDate');

        if (ref || amount || originateUrl || name || bookingNumber || paymentDate || txnId) {
            setPaymentData({
                ref: ref,
                amount: amount,
                txnId: txnId,
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
TXN ID: ${paymentData.txnId || 'N/A'}
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
        <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
            <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-12 w-auto mb-8" />

            <Card className="w-full max-w-md p-8 text-center">
                <span className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-5">Payment successful</h1>
                <p className="text-slate-500 mt-2">Your payment has been processed. A confirmation email has been sent to your registered address.</p>

                <div className="mt-6 rounded-2xl border border-slate-200 divide-y divide-slate-100 text-left text-sm">
                    <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Booking number</span><span className="font-semibold text-slate-900">{paymentData.bookingNumber || 'N/A'}</span></div>
                    <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">TXN ID</span><span className="font-semibold text-slate-900">{paymentData.txnId || 'N/A'}</span></div>
                    <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Customer name</span><span className="font-semibold text-slate-900">{paymentData.name || 'N/A'}</span></div>
                    <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Amount paid</span><span className="font-bold text-emerald-600">RM {paymentData.amount ? Number(paymentData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</span></div>
                    <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Payment date</span><span className="font-semibold text-slate-900">{formatPaymentDate(paymentData.paymentDate)}</span></div>
                </div>

                <Button fullWidth size="lg" className="mt-6" onClick={downloadReceipt}>
                    <Download className="h-4 w-4" /> Download PDF receipt
                </Button>
            </Card>

            <a href="mailto:sales@renoxpert.my" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-campaign hover:text-campaign-600">
                <Mail className="h-4 w-4" /> Email support
            </a>
        </div>
    );
}

export default PaymentSuccess;
