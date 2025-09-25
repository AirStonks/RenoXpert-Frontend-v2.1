import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    User,
    Phone,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Loader2,
    Package
} from 'lucide-react';
import { Campaign, Booking, CampaignPackage } from '../../types';
import { bookingPaymentIntent, getCampaign, validateBookingReference } from '../../services/publicApi';
import { Slide, toast, ToastContainer } from 'react-toastify';

const CampaignBookingPage = () => {
    const { campaignId } = useParams<{ campaignId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingRef, setBookingRef] = useState<string | null>(null);
    const [isValidRef, setIsValidRef] = useState<boolean | null>(null);
    const [validatingRef, setValidatingRef] = useState<boolean>(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });
    const [selectedPackage, setSelectedPackage] = useState<CampaignPackage | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Get booking reference from URL
    const ref = searchParams.get('ref');

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

    // Fetch campaign data
    useEffect(() => {
        document.title = 'Campaign Booking | RenoXpert';

        const fetchCampaign = async () => {
            if (!campaignId) {
                setError('Campaign ID is required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await getCampaign(campaignId);
                if (response?.success) {
                    setCampaign(response.data);
                    // Set first available package (with slot_remaining > 0) as default if packages exist
                    if (response.data.packages && response.data.packages.length > 0) {
                        const availablePackage = response.data.packages.find((pkg: CampaignPackage) => pkg.slot_remaining > 0) || response.data.packages[0];
                        setSelectedPackage(availablePackage);
                    }
                } else {
                    setError('Campaign not found');
                }
            } catch (err) {
                console.error('Error fetching campaign:', err);
                setError('Failed to load campaign');
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [campaignId]);

    // Validate booking reference
    useEffect(() => {
        const validateBookingRef = async () => {
            if (!ref) {
                setIsValidRef(false);
                return;
            }

            setValidatingRef(true);
            try {
                // Here you would typically validate the booking reference with your API
                // For now, we'll simulate validation
                // You can replace this with actual API call
                const response = await validateBookingReference(campaignId, ref);
                const isValid = response.success; // Simple validation for demo

                setBooking(response.data);

                if (isValid) {
                    setBookingRef(ref);
                    setIsValidRef(true);
                } else {
                    setIsValidRef(false);
                }
            } catch (err) {
                console.error('Error validating booking reference:', err);
                setIsValidRef(false);
            } finally {
                setValidatingRef(false);
            }
        };

        validateBookingRef();
    }, [campaignId, ref]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value
        }));
    };

    const handlePackageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const packageId = e.target.value;
        const pkg = campaign?.packages?.find(p => String(p.id) === String(packageId));
        setSelectedPackage(pkg || null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.phone) {
            notify('error', 'Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Here you would submit the booking form data
            // For now, we'll simulate submission
            const amount = selectedPackage?.base_amount || booking?.amount;
            const response = await bookingPaymentIntent(booking?.id, formData.name, formData.phone, amount, selectedPackage?.id);


            if (response.message === 'Success') {
                // Redirect to the payment page, not navigate
                window.location.href = response.result[0].url;
            } else {
                notify('error', response.message);
            }

            // You can redirect to a success page or show success message
        } catch (err) {
            console.error('Error submitting booking:', err);
            notify('error', 'Failed to submit booking');
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading campaign...</p>
                </div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The requested campaign could not be found.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Campaign Booking</h1>
                            <p className="text-sm text-gray-600">Complete your booking for this campaign</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex flex-col gap-8">
                        {/* Campaign Information */}
                        <div className="col-span-1">
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <Calendar className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                                        {campaign.description && (
                                            <p className="text-sm text-gray-600 leading-relaxed">{campaign.description}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Packages Selection */}
                        {campaign.packages && campaign.packages.length > 0 && (
                            <div className="col-span-1">
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-purple-100 rounded-xl">
                                            <Package className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">Select Package</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {campaign.packages.map((pkg, index) => (
                                            <div key={pkg.id || index} className="relative">
                                                <input
                                                    type="radio"
                                                    id={`package-${pkg.id || index}`}
                                                    name="package"
                                                    value={pkg.id}
                                                    checked={String(selectedPackage?.id) === String(pkg.id)}
                                                    onChange={handlePackageChange}
                                                    className="sr-only"
                                                    disabled={pkg.slot_remaining === 0}
                                                />
                                                <label
                                                    htmlFor={`package-${pkg.id || index}`}
                                                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${String(selectedPackage?.id) === String(pkg.id)
                                                            ? 'border-purple-300 bg-purple-50/50 shadow-md'
                                                            : 'border-gray-200 bg-white/60 hover:border-purple-200 hover:bg-purple-25/50'
                                                        } ${pkg.slot_remaining === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${String(selectedPackage?.id) === String(pkg.id)
                                                                    ? 'border-purple-500 bg-purple-500'
                                                                    : 'border-gray-300'
                                                                }`}>
                                                                {String(selectedPackage?.id) === String(pkg.id) && (
                                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-semibold text-gray-900">{pkg.name || `Package ${index + 1}`}</h3>
                                                                {pkg.description && (
                                                                    <p className="text-xs text-gray-600 mt-1">{pkg.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-md font-bold text-gray-900">
                                                                RM {pkg.base_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                            </div>
                                                            {pkg.slot_remaining === 0 && (
                                                                <div className="text-2xs text-gray-500">
                                                                    Fully Booked
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Form */}
                        <div className="col-span-1">
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 rounded-xl">
                                        <CreditCard className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Booking Information</h2>
                                </div>

                                {/* Booking Reference Validation */}
                                {validatingRef ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                                        <p className="text-gray-600">Validating booking reference...</p>
                                    </div>
                                ) : !isValidRef ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Invalid Booking Reference</h3>
                                        <p className="text-gray-600 mb-6">
                                            The booking reference is missing or invalid. Please contact our sales person to obtain a valid booking reference.
                                        </p>
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                            <p className="text-sm text-red-700">
                                                <strong>Contact Information:</strong><br />
                                                Email: sales@renoxpert.com
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Check if booking is already paid */}
                                        {booking?.status === 'paid' ? (
                                            <div className="text-center py-8">
                                                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Already Paid</h3>
                                                <p className="text-gray-600 mb-6">
                                                    This booking has already been paid successfully. No further payment is required.
                                                </p>
                                                <p className="text-sm text-gray-600 mb-6">Reference: {bookingRef}</p>
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-medium text-gray-700">Booking Number:</span>
                                                            <span className="text-xs font-semibold text-gray-900">{booking?.booking_no}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-medium text-gray-700">Amount Paid:</span>
                                                            <span className="text-xs font-semibold text-green-600">RM {booking?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-medium text-gray-700">Status:</span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Paid
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6">
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        Need assistance? Contact our sales team
                                                    </p>
                                                    <div className="flex justify-center space-x-4 text-sm">
                                                        <a href="mailto:sales@renoxpert.com" className="text-blue-600 hover:text-blue-800 flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            Email Sales
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                        <span className="text-sm font-medium text-green-800">Valid Booking Reference</span>
                                                    </div>
                                                    <p className="text-sm text-green-700">Reference: {bookingRef}</p>
                                                </div>

                                                <form onSubmit={handleSubmit} className="space-y-6">
                                                    {/* Name Field */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Full Name *
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <User className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={formData.name}
                                                                onChange={handleInputChange}
                                                                required
                                                                className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-transparent transition-all duration-200"
                                                                placeholder="Enter your full name"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Phone Field */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Phone Number *
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Phone className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleInputChange}
                                                                required
                                                                className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-transparent transition-all duration-200"
                                                                placeholder="Enter your phone number"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Booking Amount Display */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Booking Amount
                                                        </label>

                                                        <div className="w-full p-3 bg-green-50 border border-green-200 rounded-xl">
                                                            <div className="text-lg font-bold text-green-700">
                                                                RM {selectedPackage?.base_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || booking?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                            </div>
                                                            {selectedPackage && (
                                                                <div className="text-sm text-green-600 mt-1">
                                                                    Selected: {selectedPackage.name || 'Package'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Submit Button */}
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CreditCard className="h-4 w-4" />
                                                                Make Payment
                                                            </>
                                                        )}
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer />
        </>
    );
};

export default CampaignBookingPage;
