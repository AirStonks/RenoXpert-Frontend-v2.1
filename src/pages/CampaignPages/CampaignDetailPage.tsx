import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Phone,
    Mail,
    CreditCard,
    AlertCircle,
    Loader2,
    Package,
    Clock,
    Shield,
    CheckCircle,
    ArrowRight,
    XCircle,
    Hammer,
    Store,
    DollarSign,
    ArrowDown
} from 'lucide-react';
import { Attachment, Campaign, CampaignPackage } from '../../types';
import { bookingPaymentIntent, getCampaign } from '../../services/publicApi';
import { Slide, toast, ToastContainer } from 'react-toastify';

const CampaignDetailPage = () => {
    const { campaignSlug } = useParams<{ campaignSlug: string }>();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [selectedPackage, setSelectedPackage] = useState<CampaignPackage | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isFullyBooked, setIsFullyBooked] = useState<boolean>(false);


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
        document.title = campaign?.title || 'Campaign Booking | RenoXpert';

        const fetchCampaign = async () => {
            if (!campaignSlug) {
                setError('Campaign ID is required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await getCampaign(campaignSlug);
                if (response?.success) {
                    setCampaign(response.data);
                    // Set first available package (with slot_remaining > 0) as default if packages exist
                    if (response.data.packages && response.data.packages.length > 0) {
                        // Check if all packages are fully booked
                        const allPackagesBooked = response.data.packages.every((pkg: CampaignPackage) => pkg.slot_remaining === 0);
                        setIsFullyBooked(allPackagesBooked);

                        const availablePackage = response.data.packages.find((pkg: CampaignPackage) => pkg.slot_remaining > 0) || response.data.packages[0];
                        setSelectedPackage(availablePackage);
                    } else {
                        // For single campaigns, check if campaign is fully booked
                        const campaignSlotRemaining = (response.data.slot_total || 0) - (response.data.slot_used || 0);
                        setIsFullyBooked(campaignSlotRemaining === 0);

                        // For single campaigns, set selectedPackage to null
                        setSelectedPackage(null);
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
    }, [campaignSlug, campaign?.title]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // For phone field, only allow numeric characters
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'amount' ? parseFloat(value) || 0 : value
            }));
        }
    };

    const handlePackageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const packageId = e.target.value;
        const pkg = campaign?.packages?.find(p => String(p.id) === String(packageId));
        setSelectedPackage(pkg || null);

        // Scroll to booking form after a short delay to allow state update
        setTimeout(() => {
            const bookingSection = document.getElementById('booking-section');
            bookingSection?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.phone) {
            notify('error', 'Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create payment intent for new booking
            const packageId = selectedPackage?.id || null;
            console.log(selectedPackage);

            const response = await bookingPaymentIntent(campaignSlug, formData.name, formData.phone, formData.email, packageId);


            if (response.message === 'Success') {
                // Redirect to the payment page, not navigate
                window.location.href = response.result[0].url;
            } else {
                notify('error', response.message);
            }

            // You can redirect to a success page or show success message
        } catch (err: unknown) {
            console.error('Error submitting booking:', err);

            // Check if it's a 400 error with fully_redeemed code
            if (err && typeof err === 'object' && 'response' in err &&
                err.response && typeof err.response === 'object' &&
                'status' in err.response && err.response.status === 400 &&
                'data' in err.response && err.response.data &&
                typeof err.response.data === 'object' &&
                'data' in err.response.data && err.response.data.data &&
                typeof err.response.data.data === 'object' &&
                'code' in err.response.data.data && err.response.data.data.code === 'fully_redeemed') {
                // If it's a package-specific redemption, update the package status
                if (selectedPackage && campaign?.packages) {
                    notify('error', `The "${selectedPackage.name}" package is fully redeemed. Please select another package.`);

                    const updatedPackages = campaign.packages.map(pkg =>
                        pkg.id === selectedPackage.id
                            ? { ...pkg, slot_remaining: 0, slot_used: pkg.slot_total }
                            : pkg
                    );
                    setCampaign({ ...campaign, packages: updatedPackages });

                    // Check if all packages are now fully booked
                    const allPackagesBooked = updatedPackages.every(pkg => pkg.slot_remaining === 0);
                    if (allPackagesBooked) {
                        setIsFullyBooked(true);
                        notify('error', 'All packages are fully redeemed. No more slots are available.');
                    } else {
                        // Select the next available package
                        const nextAvailablePackage = updatedPackages.find(pkg => pkg.slot_remaining > 0);
                        setSelectedPackage(nextAvailablePackage || null);
                    }
                } else {
                    // For single campaigns, mark as fully booked
                    notify('error', 'This campaign is fully redeemed. No more slots are available.');
                    setIsFullyBooked(true);
                }
            } else {
                // Handle other errors
                notify('error', 'Failed to submit booking');
            }
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
        <div className='w-full h-max'>
            <div className="w-full h-full bg-gradient-to-br from-white via-gray-50 to-blue-50">
                {/* Header with Logo */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <img
                                    src="/app/RenoExpert_logo-01.svg"
                                    alt="RenoXpert Logo"
                                    className="h-8 sm:h-10 w-auto"
                                />
                                <div className="ml-3 sm:ml-4">
                                    <h1 className="text-base sm:text-lg font-semibold text-gray-900">Campaign</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0"></div>
                    <div className="absolute inset-0 opacity-20"></div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            {/* Mobile Title - Only visible on mobile */}
                            <div className="space-y-3 sm:space-y-4 lg:hidden order-1">
                                {/* Title */}
                                <div className="space-y-3 sm:space-y-4">
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                                        {campaign.title}
                                    </h1>
                                </div>
                            </div>

                            {/* Thumbnail */}
                            <div className="relative order-2 lg:order-2">
                                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                                    <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center">
                                        {campaign.thumbnail ? (
                                            <img
                                                src={(campaign.thumbnail as Attachment).file_url}
                                                alt={campaign.title}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-center text-white p-4 sm:p-8">
                                                <Package className="h-16 w-16 sm:h-24 sm:w-24 mx-auto mb-3 sm:mb-4 opacity-80" />
                                                <h3 className="text-lg sm:text-2xl font-semibold mb-2">{campaign.title}</h3>
                                                <p className="text-sm sm:text-base text-blue-100">Professional Service</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            </div>

                            {/* Mobile Description - Only visible on mobile, below thumbnail */}
                            {campaign.description && (
                                <div className="lg:hidden order-3">
                                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                        {campaign.description
                                            .split('\n')
                                            .map((line, idx) => (
                                                <span key={idx}>
                                                    {line}
                                                    <br />
                                                </span>
                                            ))
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Desktop Content - Only visible on large screens */}
                            <div className="space-y-6 sm:space-y-8 order-3 lg:order-1 hidden lg:block">
                                {/* Badge */}
                                <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs sm:text-sm font-medium text-green-700">Limited Time Offer</span>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-3 sm:space-y-4">
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                        {campaign.title}
                                    </h1>
                                    {campaign.description && (
                                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                                            {campaign.description
                                                .split('\n')
                                                .map((line, idx) => (
                                                    <span key={idx}>
                                                        {line}
                                                        <br />
                                                    </span>
                                                ))
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Key Benefits */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl backdrop-blur-sm">
                                        <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg ">
                                            <Hammer className="h-4 w-4 sm:h-4 sm:w-4 text-red-600" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Renovate Smart</span>
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl backdrop-blur-sm">
                                        <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                                            <Store className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Rent Out Fast</span>
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl backdrop-blur-sm">
                                        <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                                            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Enjoy Passive Income</span>
                                    </div>
                                </div>

                                {/* Book Now Button or Fully Booked Message */}
                                <div className="flex justify-center">
                                    {isFullyBooked ? (
                                        <div className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl flex items-center gap-3 font-semibold text-lg shadow-lg">
                                            <XCircle className="h-5 w-5" />
                                            Fully Booked
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (campaign.packages && campaign.packages.length > 0) {
                                                    const packagesSection = document.getElementById('packages-section');
                                                    packagesSection?.scrollIntoView({ behavior: 'smooth' });
                                                } else {
                                                    const bookingSection = document.getElementById('booking-section');
                                                    bookingSection?.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105"
                                        >
                                            <CreditCard className="h-5 w-5" />
                                            Book Now
                                            <ArrowDown className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Content - Only visible on mobile */}
                            <div className="space-y-6 sm:space-y-8 order-4 lg:hidden">
                                {/* Key Benefits */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                    <div className="flex flex-col items-center space-y-2 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                                        <div className="p-2 bg-red-200 rounded-lg">
                                            <Hammer className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Renovate Smart</span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-2 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                                        <div className="p-2 bg-red-200 rounded-lg">
                                            <Store className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Rent Out Fast</span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-2 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                                        <div className="p-2 bg-red-200 rounded-lg">
                                            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Enjoy Passive Income</span>
                                    </div>
                                </div>

                                {/* Book Now Button or Fully Booked Message */}
                                <div className="flex justify-center">
                                    {isFullyBooked ? (
                                        <div className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl flex items-center gap-3 font-semibold text-lg shadow-lg">
                                            <XCircle className="h-5 w-5" />
                                            Fully Booked
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (campaign.packages && campaign.packages.length > 0) {
                                                    const packagesSection = document.getElementById('packages-section');
                                                    packagesSection?.scrollIntoView({ behavior: 'smooth' });
                                                } else {
                                                    const bookingSection = document.getElementById('booking-section');
                                                    bookingSection?.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105"
                                        >
                                            <CreditCard className="h-5 w-5" />
                                            Book Now
                                            <ArrowDown className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    {isFullyBooked ? (
                        /* Fully Booked Layout */
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <XCircle className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Campaign Fully Booked</h2>
                                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                    We're sorry, but this campaign is currently fully booked. All available slots have been taken.
                                </p>
                                <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                                    <div className="flex items-center justify-center space-x-3 text-red-700">
                                        <XCircle className="h-6 w-6" />
                                        <span className="font-semibold text-lg">No Available Slots</span>
                                    </div>
                                    <p className="text-red-600 mt-3">
                                        Please check back later or contact us for other available campaigns.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Available Campaign Layout */
                        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
                            {/* Left Column - Packages or Campaign Info */}
                            <div className="lg:col-span-2 space-y-6 lg:space-y-8">

                                {/* Packages Selection */}
                                {campaign.packages && campaign.packages.length > 0 ? (
                                    <div id="packages-section" className="space-y-4 sm:space-y-6">
                                        <div className="text-center">
                                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Choose Your Package</h2>
                                            <p className="text-base sm:text-lg text-gray-600">Select the perfect package for your needs</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            {campaign.packages.map((pkg, index) => (
                                                <div key={pkg.id || index} className="relative group">
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
                                                        className={`block relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 ${String(selectedPackage?.id) === String(pkg.id)
                                                            ? 'bg-gradient-to-br from-blue-50 via-white to-purple-50 ring-4 ring-blue-500 shadow-2xl scale-102 sm:scale-105 border-2 border-blue-400'
                                                            : index === 0
                                                                ? 'bg-gradient-to-br from-amber-50 via-white to-orange-50 ring-2 ring-amber-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 border-2 border-amber-200'
                                                                : 'bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2'
                                                            } ${pkg.slot_remaining === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {/* Popular Badge */}
                                                        {index === 0 && (
                                                            <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                                                                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-4 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-lg animate-pulse">
                                                                    ⭐ Most Popular
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Selected Badge */}
                                                        {String(selectedPackage?.id) === String(pkg.id) && (
                                                            <div className="absolute -top-3 sm:-top-4 left-4 z-10">
                                                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1">
                                                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    Selected
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Slot Status - Top Right */}
                                                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                                                            {pkg.slot_remaining === 0 ? (
                                                                <div className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-md">
                                                                    Fully Booked
                                                                </div>
                                                            ) : (
                                                                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-md">
                                                                    {pkg.slot_remaining > 7 ? '7' : pkg.slot_remaining} {pkg.slot_remaining === 1 ? 'Slot' : 'Slots'} Left
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Package Content */}
                                                        <div className="space-y-4 sm:space-y-6">
                                                            {/* Header */}
                                                            <div className="text-center">
                                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                                                </div>
                                                                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                                                                    {pkg.name || `Package ${index + 1}`}
                                                                </h3>
                                                            </div>

                                                            {/* Package Description */}
                                                            {pkg.description && (
                                                                <p className="p-2 text-sm sm:text-base text-gray-700 leading-relaxed">
                                                                    {pkg.description
                                                                        .split('\n')
                                                                        .map((line, idx) => (
                                                                            <span key={idx}>
                                                                                {line}
                                                                                <br />
                                                                            </span>
                                                                        ))
                                                                    }
                                                                </p>
                                                            )}

                                                            {/* Pricing */}
                                                            <div className="text-center pt-3 sm:pt-4 border-t border-gray-100">
                                                                <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                                                                    RM {pkg.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                                {pkg.booking_amount && pkg.booking_amount > 0 && (
                                                                    <div className="text-sm sm:text-base text-blue-600 font-medium">
                                                                        Booking Fee
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Selection Indicator */}
                                                            <div className="flex justify-center">
                                                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${String(selectedPackage?.id) === String(pkg.id)
                                                                    ? 'border-blue-500 bg-blue-500'
                                                                    : 'border-gray-300'
                                                                    }`}>
                                                                    {String(selectedPackage?.id) === String(pkg.id) && (
                                                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Single Campaign Info Section */
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Campaign Details</h2>
                                            <p className="text-base sm:text-lg text-gray-600">Complete your booking for this campaign</p>
                                        </div>

                                        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100">
                                            <div className="space-y-6">
                                                {/* Campaign Info */}
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <Package className="h-8 w-8 text-white" />
                                                    </div>
                                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{campaign.title}</h3>
                                                    {campaign.description && (
                                                        <p className="text-gray-600 leading-relaxed">{campaign.description}</p>
                                                    )}
                                                </div>

                                                {/* Campaign Features */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl">
                                                        <div className="p-2 bg-red-100 rounded-lg">
                                                            <Hammer className="h-5 w-5 text-red-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">Renovate Smart</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl">
                                                        <div className="p-2 bg-red-100 rounded-lg">
                                                            <Store className="h-5 w-5 text-red-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">Rent Out Fast</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl">
                                                        <div className="p-2 bg-red-100 rounded-lg">
                                                            <DollarSign className="h-5 w-5 text-red-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">Enjoy Passive Income</span>
                                                    </div>
                                                </div>

                                                {/* Campaign Pricing */}
                                                {campaign.base_amount && campaign.base_amount > 0 && (
                                                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                                                        <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
                                                            RM {campaign.base_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        {campaign.booking_amount && campaign.booking_amount > 0 && (
                                                            <div className="text-lg text-blue-500 font-medium mb-2">
                                                                Booking: RM {campaign.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Right Column - Booking Form */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-4 lg:top-8">
                                    <div id="booking-section" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-100">
                                        <div className="text-center mb-6 sm:mb-8">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Book Now</h2>
                                            <p className="text-sm sm:text-base text-gray-600">Secure your spot today</p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                            {/* Selected Package Display */}
                                            {selectedPackage ? (
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">{selectedPackage.name}</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Campaign Display for Single Campaigns */
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">{campaign.title}</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Name Field */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                                    Full Name *
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                                                        placeholder="Enter your full name"
                                                    />
                                                </div>
                                            </div>

                                            {/* Phone Field */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                                    Phone Number *
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required
                                                        pattern="[0-9]*"
                                                        maxLength={15}
                                                        inputMode="numeric"
                                                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                                                        placeholder="Enter your phone number"
                                                    />
                                                </div>
                                            </div>

                                            {/* Email Field */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                                    Email Address (Optional)
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                                                        placeholder="Enter your email address"
                                                    />
                                                </div>
                                            </div>

                                            {/* Booking Amount Display */}
                                            {((selectedPackage && selectedPackage.booking_amount && selectedPackage.booking_amount > 0) ||
                                                (!selectedPackage && campaign.booking_amount && campaign.booking_amount > 0)) && (
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="p-2 bg-green-100 rounded-lg">
                                                                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Booking Amount</h4>
                                                                    <p className="text-xs sm:text-sm text-gray-600">Amount to pay now</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg sm:text-xl font-bold text-green-600">
                                                                    RM {(selectedPackage?.booking_amount || campaign.booking_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Security Badge */}
                                            <div className="flex items-center justify-center space-x-2 p-2 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl border border-green-200">
                                                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                                <span className="text-xs sm:text-sm font-medium text-green-700">Secure Payment Processing</span>
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                                        <span className="text-sm sm:text-base">Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        <span className="text-sm sm:text-base">Secure Payment</span>
                                                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </>
                                                )}
                                            </button>

                                            {/* Trust Indicators */}
                                            <div className="text-center space-y-1 sm:space-y-2">
                                                <p className="text-xs text-gray-500">By booking, you agree to our terms and conditions</p>
                                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-400">
                                                    <div className="flex items-center space-x-1">
                                                        <Shield className="h-3 w-3" />
                                                        <span>SSL Secure</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Instant Confirmation</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToastContainer />
        </div>
    );
};

export default CampaignDetailPage;
