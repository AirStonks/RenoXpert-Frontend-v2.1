import React, { useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Calendar,
    TrendingUp,
    Eye,
    EyeOff,
    BarChart3,
    Target,
    Download,
    DollarSign,
    CreditCard,
    Package,
    Users,
} from 'lucide-react';
import { Booking, CampaignPackage, Campaign } from '../../types';
import useFetchCampaign from '../../hook/useFetchCampaign';
import useFetchCampaignBookings from '../../hook/useFetchCampaignBookings';
import { Slide, toast } from 'react-toastify';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const CAMPAIGN_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_CLIENT_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_CLIENT_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/campaign/'
                : null;



// Reusable: Bookings list view
const BookingsListView = ({
    bookings,
    campaign,
}: {
    bookings: Booking[]
    campaign?: Campaign
}) => {
    const currency = (v: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 2 }).format(v || 0)
    const format = (d?: string) => (d ? new Date(d).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" }) : "-")
    const statusClass = (status?: string) => {
        switch (status) {
            case "completed":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            case "pending":
                return "bg-amber-50 text-amber-700 border-amber-200"
            case "expired":
                return "bg-red-50 text-red-700 border-red-200"
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200"
            default:
                return "bg-gray-50 text-gray-700 border-gray-200"
        }
    }

    return (
        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="rounded-2xl border-2 border-green-100/60 overflow-hidden shadow-lg">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-green-500/8 to-emerald-500/8 border-b border-green-200/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                            <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">Booking Details</h4>
                            <p className="text-sm text-gray-600">Manage and track all bookings</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-green-700 uppercase tracking-wider">
                        <div>Booking Details</div>
                        <div>Booked Date</div>
                        <div>Amount</div>
                        <div>Status</div>
                        <div>Campaign Package</div>
                    </div>
                </div>

                {/* Booking Rows */}
                <div className="divide-y divide-green-100/50">
                    {bookings.map((booking, index) => (
                        <div key={booking.id} className="px-6 py-4 hover:bg-white/70 transition-all duration-200 group">
                            <div className="grid grid-cols-5 gap-4 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-sm">
                                        <CreditCard className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h6 className="font-semibold text-gray-900 text-sm group-hover:text-green-700 transition-colors">Booking #{index + 1}</h6>
                                        <p className="text-xs text-gray-600">ID: {booking.id || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <div className="p-1 bg-green-100 rounded-lg">
                                            <Calendar className="h-3 w-3 text-green-600" />
                                        </div>
                                        <span className="font-medium">{format(booking.booked_at)}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">Booked Date</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">{currency(booking.amount || 0)}</p>
                                    <p className="text-xs text-gray-600">Amount</p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 ${statusClass(booking.status)} shadow-sm`}>
                                        {booking.status || 'Unknown'}
                                    </span>
                                </div>
                                <div>
                                    {booking.campaign_package_id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-blue-100 rounded-lg">
                                                <Package className="h-3 w-3 text-blue-600" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {campaign?.packages?.find(pkg => pkg.id === booking.campaign_package_id)?.name || `Package ${booking.campaign_package_id}`}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

// Reusable: Campaign Packages Table View
const CampaignPackagesListView = ({
    packages,
}: {
    packages: CampaignPackage[]
}) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const currency = (v: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 2 }).format(v || 0);

    const getStatusBadgeClass = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'inactive':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'draft':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'completed':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="rounded-2xl border-2 border-blue-100/60 overflow-hidden shadow-lg">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500/8 to-indigo-500/8 border-b border-blue-200/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">Campaign Packages</h4>
                            <p className="text-sm text-gray-600">Manage and view all campaign packages</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {packages.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Packages Available</h4>
                        <p className="text-gray-600">This campaign doesn't have any packages configured.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Package Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Slots
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Date Range
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {packages.map((pkg, index) => (
                                    <tr key={pkg.id || index} className="hover:bg-gray-50/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-sm">
                                                    <Package className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <h6 className="font-semibold text-gray-900 text-sm">{pkg.name || `Package ${index + 1}`}</h6>
                                                    <p className="text-xs text-gray-600">ID: {pkg.id || 'N/A'}</p>
                                                    {pkg.description && (
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pkg.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(pkg.status)}`}>
                                                {pkg.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-900">{currency(pkg.base_amount || 0)}</p>
                                                {pkg.booking_amount && pkg.booking_amount !== pkg.base_amount && (
                                                    <p className="text-xs text-gray-600">Booking: {currency(pkg.booking_amount)}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3 w-3 text-blue-600" />
                                                    <span className="text-xs text-gray-600">Total: {pkg.slot_total || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span className="text-xs text-gray-600">Used: {pkg.slot_used || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-xs text-gray-600">Remaining: {(pkg.slot_total || 0) - (pkg.slot_used || 0)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 text-amber-600" />
                                                    <span className="text-xs text-gray-600">Start: {formatDate(pkg.start_date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 text-amber-600" />
                                                    <span className="text-xs text-gray-600">End: {formatDate(pkg.end_date)}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

// Skeleton component for shimmering effect
const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
)

// Reusable: Campaign Progress Panel
const CampaignProgressPanel = ({
    title,
    percentage = 0,
    usedSlots = 0,
    totalSlots = 0,
}: {
    title: string
    percentage?: number
    usedSlots?: number
    totalSlots?: number
}) => {
    const remaining = (totalSlots || 0) - (usedSlots || 0)
    return (
        <div className="flex flex-col w-full">
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 text-lg font-semibold mb-6">
                    <div className="p-2 bg-blue-50 rounded-full">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    {title}
                </div>
            </div>
            <div className="px-6 pb-6 space-y-6">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - (percentage || 0))}`} className="text-blue-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900">{Math.round((percentage || 0) * 100)}%</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Used Slots</span>
                        <span className="font-bold text-blue-600">{usedSlots}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Total Slots</span>
                        <span className="font-bold text-gray-900">{totalSlots}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Remaining</span>
                        <span className="font-bold text-green-600">{remaining}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CampaignDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { state } = useLocation();
    const [showInternalDescription, setShowInternalDescription] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("bookings");

    const campaignId = id ? parseInt(id, 10) : null;
    const { campaign, loading, error } = useFetchCampaign(campaignId);
    const { bookings, loading: bookingsLoading } = useFetchCampaignBookings(campaignId);

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

    const handleBackClick = () => {
        if (state?.fromUrl) {
            navigate(state.fromUrl);
        } else {
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
        }
    };

    const handleEditClick = () => {
        navigate(`${LOCAL_PATH_PREFIX}campaigns/${id}/edit`);
    };

    const handleCopyCampaignUrl = async () => {
        if (!campaign?.slug) {
            notify('error', 'Campaign slug not available');
            return;
        }

        const campaignUrl = `${CAMPAIGN_URL}campaigns/${campaign.slug}`;
        try {
            await navigator.clipboard.writeText(campaignUrl);
            notify('success', 'Campaign URL copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = campaignUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            notify('success', 'Campaign URL copied to clipboard!');
        }
    };





    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };


    const getStatusBadgeClass = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'inactive':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'draft':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'completed':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };


    const parseMetadata = (metadata?: string) => {
        if (!metadata) return null;
        try {
            return JSON.parse(metadata);
        } catch {
            return null;
        }
    };

    const calculateProgress = () => {
        if (!campaign) return 0;
        
        // If campaign has packages, calculate aggregated metrics from packages
        if (campaign.packages && campaign.packages.length > 0) {
            const totalSlots = campaign.packages.reduce((sum, pkg) => sum + (pkg.slot_total || 0), 0);
            const usedSlots = campaign.packages.reduce((sum, pkg) => sum + (pkg.slot_used || 0), 0);
            
            if (totalSlots === 0) return 0;
            return usedSlots / totalSlots;
        }
        
        // Fallback to campaign-level metrics
        if (!campaign.slot_total || !campaign.slot_used) return 0;
        return (campaign.slot_used / campaign.slot_total);
    };

    const getAggregatedSlotMetrics = () => {
        if (!campaign) return { totalSlots: 0, usedSlots: 0, remainingSlots: 0 };
        
        // If campaign has packages, calculate aggregated metrics from packages
        if (campaign.packages && campaign.packages.length > 0) {
            const totalSlots = campaign.packages.reduce((sum, pkg) => sum + (pkg.slot_total || 0), 0);
            const usedSlots = campaign.packages.reduce((sum, pkg) => sum + (pkg.slot_used || 0), 0);
            const remainingSlots = totalSlots - usedSlots;
            
            return { totalSlots, usedSlots, remainingSlots };
        }
        
        // Fallback to campaign-level metrics
        const totalSlots = campaign.slot_total || 0;
        const usedSlots = campaign.slot_used || 0;
        const remainingSlots = totalSlots - usedSlots;
        
        return { totalSlots, usedSlots, remainingSlots };
    };

    const getDaysRemaining = () => {
        if (!campaign?.end_date) return null;
        const endDate = new Date(campaign.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Skeleton Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header Skeleton */}
                <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
                    <div className="w-full mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div>
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-9 w-24 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full mx-auto px-6 py-8 space-y-8">
                    {/* Upper Section Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Campaign Info Skeleton */}
                        <div className="lg:col-span-2 backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden min-h-[400px]">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                </div>
                            </div>
                        </div>
                        {/* Progress Tracker Skeleton */}
                        <div className="backdrop-blur-sm flex bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden lg:col-span-2 min-h-[400px]">
                            <div className="flex flex-col w-full">
                                <div className="p-6 pb-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <Skeleton className="h-6 w-32" />
                                    </div>
                                </div>
                                <div className="px-6 pb-6 space-y-6">
                                    <div className="text-center">
                                        <Skeleton className="h-24 w-24 mx-auto rounded-full mb-4" />
                                    </div>
                                    <div className="space-y-3">
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lower Section Skeleton */}
                    <div className="backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden">
                        <div className="p-6 pb-4">
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <div className="px-6 pb-6">
                            <div className="grid grid-cols-3 bg-gray-100 rounded-2xl p-1 mb-6">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Error Handling
    if (error || !campaign) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center p-6 bg-white/90 rounded-3xl shadow-lg">
                    <h2 className="text-xl font-semibold text-red-600">Error</h2>
                    <p className="text-gray-600 mt-2">{error || 'Campaign not found'}</p>
                    <button
                        onClick={handleBackClick}
                        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    const metadata = parseMetadata(campaign.metadata);
    const progress = calculateProgress();
    const slotMetrics = getAggregatedSlotMetrics();
    const daysRemaining = getDaysRemaining();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
                <div className="w-full mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to={LOCAL_PATH_PREFIX + "campaigns"}
                                className="rounded-full p-2 hover:bg-gray-100/80 transition-colors duration-200"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{campaign.title}</h1>
                                <p className="text-sm text-gray-600 mt-1">Campaign Details</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusBadgeClass(campaign.status)}`}>
                                {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                            </span>
                            <button
                                onClick={handleCopyCampaignUrl}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                            >
                                Copy Campaign URL
                            </button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                                onClick={handleEditClick}
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full mx-auto px-6 py-8 space-y-8">
                {/* Upper Section - Campaign Info & Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Campaign Information */}
                    <div className="lg:col-span-2 backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden min-h-[400px]">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-50 rounded-full">
                                    <Target className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold">Campaign Information</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl">
                                        <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                                        <p className="text-sm text-gray-600 mb-4">{campaign.description || 'No description provided'}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(campaign.status)}`}>
                                                {campaign.status || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                {campaign.thumbnail && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700">Campaign Thumbnail</h3>
                                        <div className="relative">
                                            <img 
                                                src={typeof campaign.thumbnail === 'string' ? campaign.thumbnail : (campaign.thumbnail as { file_url?: string }).file_url || String(campaign.thumbnail)} 
                                                alt={campaign.title || 'Campaign thumbnail'} 
                                                className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-xl"></div>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm font-medium text-gray-700">Start Date</span>
                                        </div>
                                        <p className="font-semibold text-gray-900">{formatDate(campaign.start_date)}</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-amber-600" />
                                            <span className="text-sm font-medium text-gray-700">End Date</span>
                                        </div>
                                        <p className="font-semibold text-gray-900">{formatDate(campaign.end_date)}</p>
                                        {daysRemaining !== null && (
                                            <p className={`text-xs mt-1 ${daysRemaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Campaign ended'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Base Amount */}
                                {campaign.base_amount && campaign.base_amount > 0 && (
                                    <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-gray-700">Base Amount</span>
                                        </div>
                                        <p className="font-semibold text-gray-900">RM {campaign.base_amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                )}


                                {/* Internal Description */}
                                {campaign.internal_description && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-700">Internal Description</h3>
                                            <button
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                onClick={() => setShowInternalDescription(!showInternalDescription)}
                                            >
                                                {showInternalDescription ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                {showInternalDescription ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                        {showInternalDescription && (
                                            <div className="p-4 bg-gray-50/50 rounded-xl">
                                                <p className="text-sm text-gray-700">{campaign.internal_description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="backdrop-blur-sm flex bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden lg:col-span-2 min-h-[400px]">
                        <CampaignProgressPanel
                            title={campaign.packages && campaign.packages.length > 0 ? "Package Slot Usage Progress" : "Slot Usage Progress"}
                            percentage={progress}
                            usedSlots={slotMetrics.usedSlots}
                            totalSlots={slotMetrics.totalSlots}
                        />
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex flex-col w-full">
                            <div className="p-6 pb-4">
                                <div className="flex items-center gap-3 text-lg font-semibold mb-6">
                                    <div className="p-2 bg-green-50 rounded-full">
                                        <BarChart3 className="h-5 w-5 text-green-600" />
                                    </div>
                                    {campaign.packages && campaign.packages.length > 0 ? "Package Breakdown" : "Campaign Stats"}
                                </div>
                            </div>
                            <div className="px-6 pb-6 space-y-6">
                                {campaign.packages && campaign.packages.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700">Total Packages</span>
                                            <span className="font-bold text-blue-600">{campaign.packages.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700">Active Packages</span>
                                            <span className="font-bold text-green-600">
                                                {campaign.packages.filter(pkg => pkg.status === 'active').length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700">Remaining Slots</span>
                                            <span className="font-bold text-purple-600">{slotMetrics.remainingSlots}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
                                            <span className="font-bold text-blue-600">78.5%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                                            <span className="font-bold text-green-600">12.3%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700">ROI</span>
                                            <span className="font-bold text-purple-600">245%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lower Section - Detailed Information */}
                <div className="backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-3xl overflow-hidden">
                    <div className="p-6 pb-4">
                        <h2 className="text-xl font-semibold">Campaign Details</h2>
                    </div>
                    <div className="px-6 pb-6">
                        {/* Custom Tab Navigation */}
                        <div className="grid grid-cols-4 bg-gray-100 rounded-2xl p-1 mb-6">
                            <button
                                onClick={() => setActiveTab("bookings")}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "bookings"
                                    ? "bg-white shadow-sm text-gray-900"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Bookings
                            </button>
                            <button
                                onClick={() => setActiveTab("packages")}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "packages"
                                    ? "bg-white shadow-sm text-gray-900"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Packages
                            </button>
                            <button
                                onClick={() => setActiveTab("configuration")}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "configuration"
                                    ? "bg-white shadow-sm text-gray-900"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Configuration
                            </button>
                            <button
                                onClick={() => setActiveTab("analytics")}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "analytics"
                                    ? "bg-white shadow-sm text-gray-900"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Analytics
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "bookings" && (
                            <div className="space-y-6">
                                {/* Campaign Bookings Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Campaign Bookings</h3>
                                        <span className="text-sm text-gray-500">{bookings.length} booking(s)</span>
                                    </div>
                                    {bookingsLoading ? (
                                        <div className="space-y-2">
                                            <div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                                            <div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                                        </div>
                                    ) : bookings.length > 0 ? (
                                        <BookingsListView
                                            bookings={bookings}
                                            campaign={campaign}
                                        />
                                    ) : (
                                        <div className="p-8 bg-gray-50/50 rounded-xl text-center">
                                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Generated</h4>
                                            <p className="text-gray-600">No bookings have been created for this campaign yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "packages" && (
                            <div className="space-y-6">
                                {/* Campaign Packages Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Campaign Packages</h3>
                                        <span className="text-sm text-gray-500">{campaign.packages?.length || 0} package(s)</span>
                                    </div>
                                    {campaign.packages && campaign.packages.length > 0 ? (
                                        <CampaignPackagesListView
                                            packages={campaign.packages}
                                        />
                                    ) : (
                                        <div className="p-8 bg-gray-50/50 rounded-xl text-center">
                                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Packages Available</h4>
                                            <p className="text-gray-600 mb-4">This campaign doesn't have any packages configured.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "configuration" && (
                            <div className="space-y-6">
                                {metadata && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {metadata.target_audience && (
                                            <div className="p-4 bg-blue-50/50 rounded-xl">
                                                <h4 className="font-medium text-gray-900 mb-2">Target Audience</h4>
                                                <p className="text-sm text-gray-700">{metadata.target_audience}</p>
                                            </div>
                                        )}
                                        {metadata.budget && (
                                            <div className="p-4 bg-green-50/50 rounded-xl">
                                                <h4 className="font-medium text-gray-900 mb-2">Budget</h4>
                                                <p className="text-sm text-gray-700">${metadata.budget.toLocaleString()}</p>
                                            </div>
                                        )}
                                        {metadata.channels && (
                                            <div className="col-span-2 p-4 bg-purple-50/50 rounded-xl">
                                                <h4 className="font-medium text-gray-900 mb-3">Marketing Channels</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {metadata.channels.map((channel: string, index: number) => (
                                                        <span key={index} className="px-3 py-1 bg-white/60 text-xs font-medium rounded-full">
                                                            {channel.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {metadata.goals && (
                                            <div className="col-span-2 p-4 bg-amber-50/50 rounded-xl">
                                                <h4 className="font-medium text-gray-900 mb-3">Campaign Goals</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {metadata.goals.map((goal: string, index: number) => (
                                                        <span key={index} className="px-3 py-1 bg-white/60 text-xs font-medium rounded-full">
                                                            {goal.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "analytics" && (
                            <div className="space-y-6">
                                <div className="text-center py-12 bg-white/70 rounded-xl border border-white/80">
                                    <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                        <BarChart3 className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                                    <p className="text-gray-600 mb-6">Detailed campaign analytics and performance metrics will be available here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}