import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    User,
    Phone,
    Mail,
    CreditCard,
    Loader2,
    Package,
    ShieldCheck,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    XCircle,
    HelpCircle,
    ImageIcon,
    X
} from 'lucide-react';
import { Attachment, Campaign, CampaignLayoutType, CampaignPackage, Order } from '../../types';
import { bookingPaymentIntent, getCampaign } from '../../services/publicApi';
import { captureReferralFromUrl } from '../../utils/referral';
import { getQuotationTotal } from '../../utils/quotationPricing';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { Button } from './components/Button';
import { buttonClasses } from './components/buttonClasses';
import { Card } from './components/Card';
import { Field } from './components/Field';
import { Pill } from './components/Pill';
import { CampaignHeader } from './components/CampaignHeader';
import RoiCalculatorDrawer, { RoiCalcPackage } from './components/RoiCalculatorDrawer';

const formatRM = (value: number): string =>
    value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const CampaignLayoutDetailPage = () => {
    const { campaignSlug, layoutTypeId } = useParams<{ campaignSlug: string; layoutTypeId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const groupPrefix = location.pathname.startsWith('/campaign/campaigns/') ? '/campaign' : '';

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
    const [photo, setPhoto] = useState<string | null>(null);

    useEffect(() => {
        captureReferralFromUrl(window.location.search);
    }, []);

    // Esc closes the photo lightbox (mirrors the landing's video modal pattern).
    useEffect(() => {
        if (!photo) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPhoto(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [photo]);

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

    // Resolve the layout + its sub-packages from the fetched campaign.
    const layout: CampaignLayoutType | null =
        campaign?.layout_types?.find((lt) => String(lt.id) === String(layoutTypeId)) ?? null;
    const layoutPackages: CampaignPackage[] = (campaign?.packages ?? []).filter(
        (p) => String(p.layout_type_id) === String(layoutTypeId)
    );

    // Fetch campaign data (mirrors the landing's useEffect + loading/error + document.title).
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

                    // Default-select the first sub-package for this layout with slots
                    // remaining (fallback to the first); fully booked if all sold out.
                    const ltPackages = (response.data.packages ?? []).filter(
                        (p: CampaignPackage) => String(p.layout_type_id) === String(layoutTypeId)
                    );
                    if (ltPackages.length > 0) {
                        const allPackagesBooked = ltPackages.every((pkg: CampaignPackage) => pkg.slot_remaining === 0);
                        setIsFullyBooked(allPackagesBooked);

                        const availablePackage = ltPackages.find((pkg: CampaignPackage) => pkg.slot_remaining > 0) || ltPackages[0];
                        setSelectedPackage(availablePackage);
                    } else {
                        setIsFullyBooked(false);
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
    }, [campaignSlug, layoutTypeId, campaign?.title]);

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
        const pkg = layoutPackages.find(p => String(p.id) === String(packageId));
        setSelectedPackage(pkg || null);

        // Scroll to booking form after a short delay to allow state update
        setTimeout(() => {
            const bookingSection = document.getElementById('booking-section');
            bookingSection?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.email) {
            notify('error', 'Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create payment intent for new booking
            const packageId = selectedPackage?.id || null;

            const response = await bookingPaymentIntent(campaignSlug, formData.name, formData.phone, formData.email, packageId);

            if (response.message === 'Success') {
                // Redirect to the payment page, not navigate
                window.location.href = response.result[0].url;
            } else {
                notify('error', response.message);
            }
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

                    // Check if all packages for this layout are now fully booked
                    const updatedLayoutPackages = updatedPackages.filter(
                        (p) => String(p.layout_type_id) === String(layoutTypeId)
                    );
                    const allPackagesBooked = updatedLayoutPackages.every(pkg => pkg.slot_remaining === 0);
                    if (allPackagesBooked) {
                        setIsFullyBooked(true);
                        notify('error', 'All packages are fully redeemed. No more slots are available.');
                    } else {
                        // Select the next available package
                        const nextAvailablePackage = updatedLayoutPackages.find(pkg => pkg.slot_remaining > 0);
                        setSelectedPackage(nextAvailablePackage || null);
                    }
                } else {
                    // No selected package — mark as fully booked
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
            <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-campaign animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading layout...</p>
                </div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Campaign Not Found</h1>
                    <p className="text-slate-500 mb-6">{error || 'The requested campaign could not be found.'}</p>
                    <Button onClick={() => navigate('/')}>Go Home</Button>
                </Card>
            </div>
        );
    }

    if (!layout) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Layout Not Found</h1>
                    <p className="text-slate-500 mb-6">This layout doesn&apos;t exist for this campaign.</p>
                    <Button onClick={() => navigate(`${groupPrefix}/campaigns/${campaignSlug}`)}>Back to campaign</Button>
                </Card>
            </div>
        );
    }

    const rentalProjection = layout.rental_projection as Attachment | null | undefined;
    const renderings = (layout.rendering_images ?? []) as Attachment[];

    // Bento tile sizing: repeating 6-cycle — large feature, wide, then small tiles.
    const bentoSpan = (i: number): string => {
        const m = i % 6;
        if (m === 0) return 'col-span-2 row-span-2';
        if (m === 3) return 'col-span-2 row-span-1';
        return 'col-span-1 row-span-1';
    };

    return (
        <div className="w-full min-h-screen bg-slate-50">
            <CampaignHeader
                right={
                    <Link to={`${groupPrefix}/campaigns/${campaignSlug}/faq`} className={buttonClasses({ variant: 'secondary', size: 'md' })}>
                        <HelpCircle className="h-4 w-4" /> FAQ
                    </Link>
                }
            />

            {/* Top bar — back to landing + eyebrow/title */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
                    <Link
                        to={`${groupPrefix}/campaigns/${campaignSlug}`}
                        className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
                        aria-label="Back to campaign"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </Link>
                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{campaign.title}</div>
                        <div className="font-semibold text-slate-900">{layout.name}</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-12">
                <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
                    {/* Left Column — Photos + Packages */}
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">

                        {/* Rental Projection */}
                        {rentalProjection?.file_url && (
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Rental Projection</h2>
                                <button
                                    type="button"
                                    onClick={() => setPhoto(rentalProjection.file_url ?? null)}
                                    aria-label="Enlarge rental projection"
                                    className="block w-full overflow-hidden rounded-2xl ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-campaign/40"
                                >
                                    <img
                                        src={rentalProjection.file_url}
                                        alt={`${layout.name} rental projection`}
                                        className="w-full h-56 sm:h-72 lg:h-80 object-cover hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </button>
                            </div>
                        )}

                        {/* Renderings */}
                        {renderings.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Renderings</h2>
                                    <span className="text-xs text-slate-400">{renderings.length} photos · tap to enlarge</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[140px] sm:auto-rows-[170px] gap-3 grid-flow-dense">
                                    {renderings.map((img, index) => (
                                        <button
                                            key={img.id || index}
                                            type="button"
                                            onClick={() => setPhoto(img.file_url ?? null)}
                                            aria-label={`Enlarge rendering ${index + 1}`}
                                            className={`${bentoSpan(index)} overflow-hidden rounded-xl ring-1 ring-slate-200 bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-campaign/40`}
                                        >
                                            {img.file_url ? (
                                                <img
                                                    src={img.file_url}
                                                    alt={`${layout.name} rendering ${index + 1}`}
                                                    className="w-full h-full object-cover hover:scale-[1.05] transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full grid place-items-center text-slate-400">
                                                    <ImageIcon className="h-8 w-8" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Packages */}
                        <div id="packages-section" className="space-y-4 sm:space-y-6">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Packages for {layout.name}</h2>
                                <p className="text-base text-slate-500">Select the perfect package for your needs</p>
                            </div>

                            {layoutPackages.length === 0 ? (
                                <Card className="p-8 text-center">
                                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                        <Package className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">No packages yet</h3>
                                    <p className="mt-2 text-slate-500">This layout doesn&apos;t have any packages available right now.</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {layoutPackages.map((pkg, index) => {
                                        const isSelected = String(selectedPackage?.id) === String(pkg.id);
                                        const isSoldOut = pkg.slot_remaining === 0;
                                        const startFrom = getQuotationTotal(pkg.order as Order | undefined);
                                        return (
                                            <div key={pkg.id || index} className="relative">
                                                <input
                                                    type="radio"
                                                    id={`package-${pkg.id || index}`}
                                                    name="package"
                                                    value={pkg.id}
                                                    checked={isSelected}
                                                    onChange={handlePackageChange}
                                                    className="sr-only"
                                                    disabled={isSoldOut}
                                                />
                                                <label
                                                    htmlFor={`package-${pkg.id || index}`}
                                                    className={`block relative h-full rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-200 bg-white border ${isSelected
                                                        ? 'border-2 border-campaign bg-campaign-50/40 shadow-[0_8px_28px_rgba(215,30,66,0.12)]'
                                                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                                        } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {/* Popular Badge */}
                                                    {index === 0 && (
                                                        <Pill tone="brand" className="absolute -top-3 left-5">Most popular</Pill>
                                                    )}

                                                    {/* Slot Status - Top Right */}
                                                    <div className="absolute top-4 right-4">
                                                        {isSoldOut ? (
                                                            <Pill tone="red">Fully Booked</Pill>
                                                        ) : (
                                                            <Pill tone="emerald">
                                                                {pkg.slot_remaining > 7 ? '7' : pkg.slot_remaining} {pkg.slot_remaining === 1 ? 'Slot' : 'Slots'} Left
                                                            </Pill>
                                                        )}
                                                    </div>

                                                    {/* Package Content */}
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="pr-24">
                                                            <span className="h-11 w-11 rounded-xl bg-campaign-50 grid place-items-center text-campaign mb-3">
                                                                <Package className="h-5 w-5" />
                                                            </span>
                                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                                                                {pkg.name || `Package ${index + 1}`}
                                                            </h3>
                                                        </div>

                                                        {/* Package Description */}
                                                        {pkg.description && (
                                                            <p className="text-sm text-slate-500 leading-relaxed">
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

                                                        {/* Pricing — Start from (full quotation total) */}
                                                        <div className="pt-4 border-t border-slate-100">
                                                            {startFrom > 0 ? (
                                                                <>
                                                                    <div className="text-xs text-slate-400 leading-none mb-1">Start from</div>
                                                                    <div className="text-2xl sm:text-3xl font-bold text-campaign">
                                                                        RM {formatRM(startFrom)}
                                                                    </div>
                                                                    {pkg.booking_amount && pkg.booking_amount > 0 && (
                                                                        <div className="mt-2">
                                                                            <div className="text-sm text-slate-500">Booking Fee <span className="font-semibold text-slate-700">RM {pkg.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                                                            <div className="text-[10px] sm:text-xs font-semibold text-red-600">Non-refundable</div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                pkg.booking_amount && pkg.booking_amount > 0 ? (
                                                                    <>
                                                                        <div className="text-xs text-slate-400 leading-none mb-1">Booking Fee</div>
                                                                        <div className="text-2xl sm:text-3xl font-bold text-campaign">
                                                                            RM {pkg.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </div>
                                                                        <div className="text-[10px] sm:text-xs font-semibold text-red-600 mt-1">Non-refundable</div>
                                                                    </>
                                                                ) : null
                                                            )}
                                                        </div>

                                                        {/* View quotation (per package) */}
                                                        {pkg.id && pkg.order_id && (
                                                            <div className="pt-1">
                                                                <Link
                                                                    to={`${groupPrefix}/campaigns/${campaignSlug}/packages/${pkg.id}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className={buttonClasses({ variant: 'secondary', size: 'md' })}
                                                                >
                                                                    View Quotation
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </Link>
                                                            </div>
                                                        )}

                                                        {/* Selection Indicator */}
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                                                ? 'border-campaign bg-campaign'
                                                                : 'border-slate-300'
                                                                }`}>
                                                                {isSelected && (
                                                                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                                )}
                                                            </span>
                                                            <span className="text-sm font-medium text-slate-500">
                                                                {isSelected ? 'Selected' : 'Select this package'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Booking Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-4 lg:top-8">
                            <Card id="booking-section" className="p-5 sm:p-6">
                                <div className="mb-6">
                                    <span className="h-12 w-12 rounded-2xl bg-campaign-50 grid place-items-center text-campaign mb-3">
                                        <CreditCard className="h-6 w-6" />
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Book Now</h2>
                                    <p className="text-sm text-slate-500">Secure your spot today</p>
                                </div>

                                {isFullyBooked ? (
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                                        <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                                        <h3 className="font-semibold text-lg text-slate-900">Fully Booked</h3>
                                        <p className="text-slate-500 mt-2 text-sm">
                                            All slots for this layout have been taken. Please check back later or pick another layout.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Selected Package Display */}
                                        {selectedPackage && (
                                            <div className="bg-campaign-50 rounded-xl p-3.5 border border-campaign-100">
                                                <h3 className="text-sm sm:text-base font-semibold text-slate-900">{selectedPackage.name}</h3>
                                            </div>
                                        )}

                                        {/* Name Field */}
                                        <Field label="Full Name *" icon={User} type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter your full name" />

                                        {/* Phone Field */}
                                        <Field label="Phone Number *" icon={Phone} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required pattern="[0-9]*" maxLength={15} inputMode="numeric" placeholder="Enter your phone number" />

                                        {/* Email Field */}
                                        <Field label="Email Address *" icon={Mail} type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter your email address" />

                                        {/* Booking Amount Display */}
                                        {selectedPackage && selectedPackage.booking_amount && selectedPackage.booking_amount > 0 && (
                                            <div className="bg-campaign-50 rounded-xl p-4 border border-campaign-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="h-9 w-9 rounded-xl bg-white grid place-items-center text-campaign shrink-0">
                                                            <CreditCard className="h-4 w-4" />
                                                        </span>
                                                        <div>
                                                            <h4 className="text-sm sm:text-base font-semibold text-slate-900">Booking Fee</h4>
                                                            <p className="text-xs sm:text-sm font-semibold text-red-600">Non-refundable</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg sm:text-xl font-bold text-campaign">
                                                            RM {selectedPackage.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Security Badge */}
                                        <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                                            <span className="text-xs sm:text-sm font-medium text-slate-600">Secure Payment Processing</span>
                                        </div>

                                        {/* Submit Button */}
                                        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
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
                                        </Button>

                                        {/* Trust Indicators */}
                                        <div className="text-center space-y-2">
                                            <p className="text-xs text-slate-400">By booking, you agree to our terms and conditions</p>
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-slate-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                    SSL Secure
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Instant Confirmation
                                                </span>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile sticky bottom action bar */}
            {!isFullyBooked && (
                <div className="lg:hidden sticky bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate-400 leading-none">Booking Fee</p>
                        <p className="text-base font-extrabold text-slate-900">
                            RM {(selectedPackage?.booking_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <Button onClick={() => {
                        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        Book your slot <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Photo lightbox (adapted from the C-style modal) */}
            {photo && (
                <div
                    className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPhoto(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        aria-label="Close photo"
                        className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={photo}
                        alt="Layout photo"
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[85vh] w-auto max-w-full rounded-xl bg-black object-contain"
                    />
                </div>
            )}

                {layout.roi_calculator && layout.roi_calculator.enabled && (
                    <RoiCalculatorDrawer
                        roi={layout.roi_calculator}
                        packages={layoutPackages.map((p): RoiCalcPackage => ({ id: Number(p.id), name: p.name ?? '', price: getQuotationTotal(p.order as Order | undefined) }))}
                    />
                )}
            <ToastContainer />
        </div>
    );
};

export default CampaignLayoutDetailPage;
