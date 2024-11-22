// src\pages\OwnerPages\PaymentSuccess.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Loading from '../../components/Loading';

function PaymentSuccess() {
    const [paymentData, setErrorData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        document.title = "Success | RenoXpert";
        // Parse query parameters
        const queryParams = new URLSearchParams(location.search);
        const dataStr = queryParams.get('data');

        if (dataStr) {
            setErrorData(JSON.parse(decodeURIComponent(dataStr)));
        }

        // Optionally clear the localStorage after retrieving if you had set it before
        localStorage.removeItem('data');
    }, [location]);

    if (!paymentData) {
        return <Loading />; // Show loading state if data is not yet available
    }
    
    return (
        <div className="container-fluid" id="content_container">
            <div className="flex flex-col items-center justify-center h-[95%]">

                <div className="mb-10">
                    <img alt="image" className="dark:hidden max-h-[160px]" src="/public/media/illustrations/21.svg" />
                    <img alt="image" className="light:hidden max-h-[160px]" src="/public/media/illustrations/21-dark.svg" />
                </div>
                <h3 className="text-2.5xl font-semibold text-gray-900 text-center mb-2">
                    Payment Transaction Successful
                </h3>
                <div className="text-md text-center text-gray-700 mb-3">
                    Thank you for choosing us!
                </div>
                <div className="card mb-8">
                    <div className="card-body">
                        <table className="table-auto">
                            <tbody>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Transaction No:</td>
                                    <td className="text-sm text-gray-900 font-medium pb-3">{paymentData.transactionNo}</td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Invoice No:</td>
                                    <td className="text-sm text-gray-900 font-medium pb-3">{paymentData.invoiceNo}</td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Amount:</td>
                                    <td className="text-sm text-gray-900 font-medium pb-3">
                                        {`RM ${Number(paymentData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pe-4 lg:pe-8">Date:</td>
                                    <td className="text-sm text-gray-900 font-medium">
                                        {new Date(paymentData.paymentDate).toLocaleDateString('en-GB')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="relative">
                    <Link
                        to={paymentData.returnUrl}
                        className="btn btn-lg btn-primary rounded-3xl shadow-lg">
                        Go Back
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;



// // src\pages\OwnerPages\PaymentSuccess.tsx

// import { useEffect, useState } from "react";
// import Loading from "../../components/Loading";

// function PaymentSuccess() {

//     // const [paymentData, setPaymentData] = useState(null);

//     // useEffect(() => {
//     //     const data = JSON.parse(sessionStorage.getItem('paymentSuccess'));

//     //     setPaymentData(data);
//     // }, []);

//     // if (!paymentData) {
//     //     return <Loading />; // Loading state while fetching data
//     // }

//     // return (
//     //     <div>
//     //         <h1>Payment Successful!</h1>
//     //         <p>Transaction No: {paymentData.transactionNo}</p>
//     //         <p>Invoice No: {paymentData.invoiceNo}</p>
//     //         <p>Amount: {paymentData.amount}</p>
//     //         <p>Payment Date: {new Date(paymentData.paymentDate).toLocaleString()}</p>
//     //         <a href={paymentData.returnUrl}>View Invoice</a>
//     //     </div>
//     // );
// }

// export default PaymentSuccess;