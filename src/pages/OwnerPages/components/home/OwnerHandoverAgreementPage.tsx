import React, { useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import useFetchOwnerRenoProgress from '../../../../hook/useFetchOwnerRenoProgress';
import { Slide, toast } from 'react-toastify';
import { DocumentCheckIcon } from '@heroicons/react/24/outline';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const notify = (type: "success" | "error", message: string) => {
    (toast[type] as (message: string, options?: object) => void)(message, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: localStorage.getItem("theme"),
        transition: Slide,
    });
};

export default function OwnerHandoverAgreementPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { renoProgressDetail, loading, error } = useFetchOwnerRenoProgress(Number(id));
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agreementAccepted, setAgreementAccepted] = useState(false);
    const [signature, setSignature] = useState('');

    // Check if agreement is already submitted
    const isAlreadySubmitted = renoProgressDetail?.owner_handover_submitted_at;
    const isReleased = renoProgressDetail?.owner_handover_released_at;

    const handleSubmit = async () => {
        if (!agreementAccepted) {
            notify("error", "Please accept the agreement terms before submitting");
            return;
        }

        if (!signature.trim()) {
            notify("error", "Please provide your signature");
            return;
        }

        // Navigate to OTP verification page first, then submit on success
        setIsSubmitting(true);
        try {
            navigate(`${LOCAL_PATH_PREFIX}reno/progress/${id}/handover-agreement/otp`, {
                state: {
                    countryCode: renoProgressDetail?.sale?.order?.user?.country_code,
                    mobile: renoProgressDetail?.sale?.order?.user?.phone_no,
                    handoverRenoProgressId: Number(id),
                    returnUrl: `${LOCAL_PATH_PREFIX}reno/progress/${id}/handover-agreement`,
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!renoProgressDetail) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">Reno progress not found</p>
                </div>
            </div>
        );
    }

    if (!isReleased) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-center">
                            <AlertCircleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Agreement Not Released</h1>
                            <p className="text-gray-600 mb-6">
                                The owner handover agreement has not been released yet. Please check back later.
                            </p>
                            <Link
                                to={`${LOCAL_PATH_PREFIX}reno/progress/${id}`}
                                className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                            >
                                Back to Reno Progress
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If already submitted, we will still render the page below with submitted status and read-only view

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link
                                to={location.state?.fromUrl || `${LOCAL_PATH_PREFIX}reno/progress/${id}`}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">Owner Handover Agreement</h1>
                                <p className="text-sm text-gray-600">
                                    {renoProgressDetail.property.block}-{renoProgressDetail.property.floor}-{renoProgressDetail.property.unit_no}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isAlreadySubmitted ? (
                                <>
                                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Submitted on {new Date(renoProgressDetail.owner_handover_submitted_at).toLocaleDateString()}</span>
                                </>
                            ) : (
                                <>
                                    <DocumentCheckIcon className="w-5 h-5 text-red-500" />
                                    <span className="text-sm font-medium text-red-600">Pending Submission</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Agreement Header */}
                    <div className={`border-b p-6 ${isAlreadySubmitted ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'}`}>
                        <div className="flex items-center space-x-3">
                            {isAlreadySubmitted ? (
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <DocumentCheckIcon className="w-6 h-6 text-red-600" />
                                </div>
                            )}
                            <div>
                                <h2 className={`text-xl font-bold ${isAlreadySubmitted ? 'text-green-900' : 'text-red-900'}`}>Owner Handover Agreement</h2>
                                {isAlreadySubmitted ? (
                                    <p className="text-green-700">Agreement submitted successfully. You can review the terms below.</p>
                                ) : (
                                    <p className="text-red-700">Please review and submit the handover agreement for your property</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Agreement Content */}
                    <div className="p-6 space-y-6">
                        {/* Property Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Property Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Property:</span>
                                    <span className="ml-2 font-medium">{renoProgressDetail.property.name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Unit:</span>
                                    <span className="ml-2 font-medium">
                                        {renoProgressDetail.property.block}-{renoProgressDetail.property.floor}-{renoProgressDetail.property.unit_no}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Owner:</span>
                                    <span className="ml-2 font-medium">{renoProgressDetail.sale.order.user.name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Released Date:</span>
                                    <span className="ml-2 font-medium">
                                        {renoProgressDetail.owner_handover_released_at ?
                                            new Date(renoProgressDetail.owner_handover_released_at).toLocaleDateString() :
                                            'N/A'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Agreement Terms */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Agreement Terms</h3>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-3">
                                <p>
                                    I, <strong>{renoProgressDetail.sale.order.user.name}</strong>, hereby acknowledge and agree to the following terms regarding the handover of my property:
                                </p>
                                <ol className="list-decimal list-inside space-y-3 ml-4">
                                    <li>I, the undersigned property owner of above unit, hereby confirm that all renovation work carried out on the property has been completed to my satisfaction in accordance with the agreed-upon specifications, plans, and standards.</li>
                                    <li>I have thoroughly inspected the work and found it to be in compliance with the terms of our contract. Any concerns or issues that I may have had during the course of the renovation have been addressed and resolved to my satisfaction.
                                    </li>
                                    <li>Furthermore, I confirm that all payments and financial obligations related to the renovation project will be fulfilled in accordance with our agreement within 3 working days.</li>


                                </ol>
                                <p className="mt-4">
                                    By signing this agreement, I confirm that I have read, understood, and agree to all the terms and conditions stated above.
                                </p>
                            </div>
                        </div>

                        {/* Agreement Acceptance */}
                        {!isAlreadySubmitted && (
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="agreement-accepted"
                                checked={agreementAccepted}
                                onChange={(e) => setAgreementAccepted(e.target.checked)}
                                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <label htmlFor="agreement-accepted" className="text-sm text-gray-700">
                                I have read, understood, and agree to the terms and conditions of this Owner Handover Agreement
                            </label>
                        </div>
                        )}

                        {/* Digital Signature */}
                        {!isAlreadySubmitted && (
                        <div>
                            <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2">
                                Digital Signature
                            </label>
                            <input
                                type="text"
                                id="signature"
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="Type your full name as digital signature"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                By typing your name above, you are providing your digital signature for this agreement.
                            </p>
                        </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                            <Link
                                to={location.state?.fromUrl || `${LOCAL_PATH_PREFIX}reno/progress/${id}`}
                                className="btn btn-secondary px-6 py-2 rounded-lg"
                            >
                                Cancel
                            </Link>
                            {!isAlreadySubmitted && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!agreementAccepted || !signature.trim() || isSubmitting}
                                    className="btn btn-primary bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Submitting...</span>
                                        </div>
                                    ) : (
                                        'Submit Agreement'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
