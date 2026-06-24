import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    XCircle,
    Percent,
    Calendar,
    ArrowDown,
    HelpCircle,
    Play,
    X
} from 'lucide-react';
import { Attachment, Campaign, CampaignPackage, Order } from '../../types';
import { bookingPaymentIntent, getCampaign } from '../../services/publicApi';
import { getQuotationTotal } from '../../utils/quotationPricing';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { Button } from './components/Button';
import { buttonClasses } from './components/buttonClasses';
import { Card } from './components/Card';
import { Field } from './components/Field';
import { Pill } from './components/Pill';
import { CampaignHeader } from './components/CampaignHeader';

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
    const [videoOpen, setVideoOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!videoOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setVideoOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [videoOpen]);

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

        if (!formData.name || !formData.phone || !formData.email) {
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
            <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-campaign animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading campaign...</p>
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

    const isLayered = (campaign?.layout_types?.length ?? 0) > 0;
    const youtubeEmbed = getYouTubeEmbedUrl(campaign?.thumbnail_video_url);
    const hasVideo = !!youtubeEmbed || !!campaign?.thumbnail_video;

    return (
        <div className="w-full min-h-screen bg-slate-50">
            <CampaignHeader
                right={
                    <Link to="faq" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
                        <HelpCircle className="h-4 w-4" /> FAQ
                    </Link>
                }
            />

            {/* Hero Section */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-16 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Copy */}
                    <div className="order-2 lg:order-1">
                        <Pill tone="brand"><span className="h-1.5 w-1.5 rounded-full bg-campaign" /> Limited-time offer</Pill>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mt-4">
                            {campaign.title}
                        </h1>
                        {campaign.description && (
                            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mt-4 max-w-prose">
                                {campaign.description.split('\n').map((line, idx) => (<span key={idx}>{line}<br /></span>))}
                            </p>
                        )}
                        {/* benefits — single 3-up row that reflows */}
                        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3 mt-6">
                            {[
                                { icon: Percent, label: '0% Management Fee' },
                                { icon: Calendar, label: '60 Months Instalment' },
                                { icon: CheckCircle, label: '0 Hassle & Headache' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left rounded-xl border border-slate-100 sm:border-0 p-2.5 sm:p-0">
                                    <span className="h-9 w-9 rounded-xl bg-campaign-50 grid place-items-center text-campaign"><Icon className="h-4 w-4" /></span>
                                    <span className="text-[11px] sm:text-sm font-semibold text-slate-700 mt-1.5 sm:mt-0 leading-tight">{label}</span>
                                </div>
                            ))}
                        </div>
                        {/* CTA — keep the exact scroll handler / fully-booked branch */}
                        <div className="mt-7">
                            {isFullyBooked ? (
                                <span className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-50 text-red-600 font-semibold"><XCircle className="h-5 w-5" /> Fully Booked</span>
                            ) : (
                                <Button size="lg" onClick={() => {
                                    if (campaign.packages && campaign.packages.length > 0) {
                                        document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
                                    } else {
                                        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}>
                                    <CreditCard className="h-5 w-5" /> Book your slot <ArrowDown className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-5 mt-5 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secure payment</span>
                            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Instant confirmation</span>
                        </div>
                    </div>
                    {/* Image */}
                    <div className="order-1 lg:order-2">
                        <div className="relative rounded-3xl overflow-hidden ring-1 ring-slate-200">
                            {campaign.thumbnail ? (
                                <img
                                    src={(campaign.thumbnail as Attachment).file_url}
                                    alt={campaign.title}
                                    className="w-full h-56 sm:h-80 lg:h-[420px] object-cover"
                                />
                            ) : (
                                <div className="w-full h-56 sm:h-80 lg:h-[420px] bg-slate-100 grid place-items-center text-slate-400">
                                    <Package className="h-16 w-16" />
                                </div>
                            )}
                            {hasVideo && (
                                <button
                                    type="button"
                                    onClick={() => setVideoOpen(true)}
                                    aria-label="Play campaign video"
                                    className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-campaign px-4 py-2.5 text-white shadow-lg hover:bg-campaign-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-campaign/40"
                                >
                                    <Play className="h-5 w-5" fill="currentColor" />
                                    <span className="text-sm font-semibold">Watch video</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {isFullyBooked ? (
                    /* Fully Booked Layout */
                    <div className="max-w-3xl mx-auto">
                        <Card className="text-center p-8 sm:p-10">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <XCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Campaign Fully Booked</h2>
                            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                                We're sorry, but this campaign is currently fully booked. All available slots have been taken.
                            </p>
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                <div className="flex items-center justify-center space-x-3 text-slate-700">
                                    <XCircle className="h-6 w-6 text-red-500" />
                                    <span className="font-semibold text-lg">No Available Slots</span>
                                </div>
                                <p className="text-slate-500 mt-3">
                                    Please check back later or contact us for other available campaigns.
                                </p>
                            </div>
                        </Card>
                    </div>
                ) : isLayered ? (
                    /* Layered Campaign — Choose your layout (cards link to the layout detail page) */
                    <div id="packages-section" className="lg:col-span-3 space-y-4 sm:space-y-6">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Choose your layout</h2>
                            <p className="text-base text-slate-500">Pick a layout to see its photos, packages and pricing.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {(campaign.layout_types ?? []).map((lt) => {
                                const ltPackages = (campaign.packages ?? []).filter((p) => String(p.layout_type_id) === String(lt.id));
                                const startFrom = ltPackages.reduce((min, p) => {
                                    const v = getQuotationTotal(p.order as Order | undefined);
                                    return v > 0 && (min === 0 || v < min) ? v : min;
                                }, 0);
                                const thumb = lt.layout_thumbnail as Attachment | undefined;
                                return (
                                    <Link
                                        key={String(lt.id)}
                                        to={`layouts/${lt.id}`}
                                        className="group block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_rgba(16,24,40,0.06)] hover:shadow-lg transition"
                                    >
                                        <div className="h-36 w-full bg-slate-100">
                                            {thumb?.file_url ? (
                                                <img src={thumb.file_url} alt={lt.name} className="h-36 w-full object-cover" />
                                            ) : (
                                                <div className="h-36 w-full grid place-items-center text-slate-400"><Package className="h-10 w-10" /></div>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-slate-900">{lt.name}</h3>
                                            {lt.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{lt.description}</p>}
                                            <div className="mt-4 flex items-center justify-between">
                                                {startFrom > 0 && (
                                                    <span className="text-sm text-slate-400">Start from <span className="font-bold text-campaign">RM {startFrom.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></span>
                                                )}
                                                <span className="text-sm font-semibold text-campaign inline-flex items-center gap-1">View layout <ArrowRight className="h-4 w-4" /></span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
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
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Choose Your Package</h2>
                                        <p className="text-base text-slate-500">Select the perfect package for your needs</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        {campaign.packages.map((pkg, index) => {
                                            const isSelected = String(selectedPackage?.id) === String(pkg.id);
                                            const isSoldOut = pkg.slot_remaining === 0;
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

                                                            {/* Pricing */}
                                                            <div className="pt-4 border-t border-slate-100">
                                                                <div className="text-2xl sm:text-3xl font-bold text-campaign">
                                                                    RM {pkg.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                                {pkg.booking_amount && pkg.booking_amount > 0 && (
                                                                    <div className="text-sm text-campaign font-medium">
                                                                        Booking Fee
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* View quotation (per package) */}
                                                            {pkg.id && pkg.order_id && (
                                                                <div className="pt-1">
                                                                    <Link
                                                                        to={`packages/${pkg.id}`}
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
                                </div>
                            ) : (
                                /* Single Campaign Info Section */
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Campaign Details</h2>
                                        <p className="text-base text-slate-500">Complete your booking for this campaign</p>
                                    </div>

                                    <Card className="p-6 sm:p-8">
                                        <div className="space-y-6">
                                            {/* Campaign Info */}
                                            <div>
                                                <span className="h-12 w-12 rounded-2xl bg-campaign-50 grid place-items-center text-campaign mb-4">
                                                    <Package className="h-6 w-6" />
                                                </span>
                                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{campaign.title}</h3>
                                                {campaign.description && (
                                                    <p className="text-slate-500 leading-relaxed">{campaign.description}</p>
                                                )}
                                            </div>

                                            {/* Campaign Features */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { icon: Percent, label: '0% Management Fee' },
                                                    { icon: Calendar, label: '60 Months Instalment' },
                                                    { icon: CheckCircle, label: '0 Hassle & Headache' },
                                                ].map(({ icon: Icon, label }) => (
                                                    <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100">
                                                        <span className="h-9 w-9 rounded-xl bg-campaign-50 grid place-items-center text-campaign shrink-0">
                                                            <Icon className="h-4 w-4" />
                                                        </span>
                                                        <span className="text-sm font-semibold text-slate-700 leading-tight">{label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Campaign Pricing */}
                                            {campaign.base_amount && campaign.base_amount > 0 && (
                                                <div className="text-center p-6 bg-campaign-50 rounded-2xl border border-campaign-100">
                                                    <div className="text-3xl sm:text-4xl font-bold text-campaign mb-2">
                                                        RM {campaign.base_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    {campaign.booking_amount && campaign.booking_amount > 0 && (
                                                        <div className="text-lg text-campaign font-medium mb-2">
                                                            Booking: RM {campaign.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            )}

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

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Selected Package Display */}
                                        {selectedPackage ? (
                                            <div className="bg-campaign-50 rounded-xl p-3.5 border border-campaign-100">
                                                <h3 className="text-sm sm:text-base font-semibold text-slate-900">{selectedPackage.name}</h3>
                                            </div>
                                        ) : (
                                            /* Campaign Display for Single Campaigns */
                                            <div className="bg-campaign-50 rounded-xl p-3.5 border border-campaign-100">
                                                <h3 className="text-sm sm:text-base font-semibold text-slate-900">{campaign.title}</h3>
                                            </div>
                                        )}

                                        {/* Name Field */}
                                        <Field label="Full Name *" icon={User} type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter your full name" />

                                        {/* Phone Field */}
                                        <Field label="Phone Number *" icon={Phone} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required pattern="[0-9]*" maxLength={15} inputMode="numeric" placeholder="Enter your phone number" />

                                        {/* Email Field */}
                                        <Field label="Email Address *" icon={Mail} type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter your email address" />

                                        {/* Booking Amount Display */}
                                        {((selectedPackage && selectedPackage.booking_amount && selectedPackage.booking_amount > 0) ||
                                            (!selectedPackage && campaign.booking_amount && campaign.booking_amount > 0)) && (
                                                <div className="bg-campaign-50 rounded-xl p-4 border border-campaign-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="h-9 w-9 rounded-xl bg-white grid place-items-center text-campaign shrink-0">
                                                                <CreditCard className="h-4 w-4" />
                                                            </span>
                                                            <div>
                                                                <h4 className="text-sm sm:text-base font-semibold text-slate-900">Booking Amount</h4>
                                                                <p className="text-xs sm:text-sm text-slate-500">Amount to pay now</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg sm:text-xl font-bold text-campaign">
                                                                RM {(selectedPackage?.booking_amount || campaign.booking_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile sticky bottom action bar */}
            {!isFullyBooked && !isLayered && (
                <div className="lg:hidden sticky bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate-400 leading-none">From</p>
                        <p className="text-base font-extrabold text-slate-900">
                            RM {(selectedPackage?.booking_amount || campaign.booking_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    </div>
                    <Button onClick={() => {
                        const target = (campaign.packages && campaign.packages.length > 0) ? 'packages-section' : 'booking-section';
                        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        Book now <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {videoOpen && hasVideo && (
                <div
                    className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setVideoOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        onClick={() => setVideoOpen(false)}
                        aria-label="Close video"
                        className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    {youtubeEmbed ? (
                        <iframe
                            src={youtubeEmbed}
                            title="Campaign video"
                            className="w-full aspect-video rounded-lg max-w-4xl mx-auto"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <video
                            src={(campaign.thumbnail_video as Attachment).file_url}
                            controls
                            autoPlay
                            onClick={(e) => e.stopPropagation()}
                            className="max-h-[80vh] w-auto max-w-full rounded-xl bg-black"
                        />
                    )}
                </div>
            )}

            <ToastContainer />
        </div>
    );
};

export default CampaignDetailPage;
