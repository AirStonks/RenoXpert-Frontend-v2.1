import React, { useState } from 'react';
import {
    MapPin,
    Star,
    ArrowLeft,
    EditIcon
} from 'lucide-react';
import { ROIProgramModal } from '../OwnerPages/components/Modals/ROIProjectModal';
import useFetchProperty from '../../hook/useFetchProperty';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PreviewROIProgramModal } from './components/Modals/PreviewROIProgramModal';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

export const PropertyDetail: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const propertyId = id ? parseInt(id, 10) : null;
    const { propertyDetail, loading, error, abort } = useFetchProperty(propertyId);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                {/* Header Skeleton */}
                <div className="relative">
                    <div className="absolute top-12 left-4 right-4 z-20 flex justify-between items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                    </div>
                    {/* Hero Image Skeleton */}
                    <div className="relative h-80 overflow-hidden">
                        <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="px-4 -mt-6 relative z-10">
                    {/* Main Info Card Skeleton */}
                    <div className="flex w-full gap-4">
                        <div className="bg-white/80 rounded-3xl shadow-xl border border-white/20 p-6 mb-4 w-full">
                            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="text-center">
                                        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2 animate-pulse" />
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Address Details Card Skeleton */}
                        <div className="bg-white/80 rounded-3xl shadow-xl border border-white/20 p-6 mb-4 w-full">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
                            <div className="space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* ROI Program Card Skeleton */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-xl border border-blue-100/50 p-6 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                            <div>
                                <div className="h-6 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                            </div>
                        </div>
                        <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
                    </div>
                    {/* Image Gallery Skeleton */}
                    <div className="bg-white/80 rounded-3xl shadow-xl border border-white/20 p-6 mb-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
                        <div className="grid grid-cols-2 gap-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl bg-gray-200 animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 w-full max-w-md text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Property</h2>
                    <p className="text-gray-600 mb-4">{error || 'An unexpected error occurred. Please try again later.'}</p>
                    {/* <button
                        onClick={() => navigate(-1)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                    >
                        Go Back
                    </button> */}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <div className="relative">
                <div className="absolute top-12 left-4 right-4 z-20 flex justify-between items-center">
                    <button
                        onClick={() => navigate(`${LOCAL_PATH_PREFIX}properties`)}
                        className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>

                    <div className="flex gap-3">
                        {/* <button
                            onClick={() => setIsBookmarked(!isBookmarked)}
                            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200"
                        >
                            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'text-blue-600 fill-blue-600' : 'text-gray-700'}`} />
                        </button> */}
                        <button
                            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200"
                            onClick={() => navigate(`${LOCAL_PATH_PREFIX}properties/${propertyDetail.id}/edit`)}
                        >
                            <EditIcon className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </div>

                {/* Hero Image */}
                <div className="relative h-80 overflow-hidden">
                    {propertyDetail.thumbnail_url ? (
                        <img
                            src={propertyDetail.thumbnail_url}
                            alt={propertyDetail.name || 'Property Image'}
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    ) : (
                        <div
                            className="w-full h-full rounded-2xl"
                            style={{ background: 'linear-gradient(to top, rgba(75, 85, 99, 0.2), rgba(31, 41, 55, 0.2))' }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-2xl" />
                </div>
            </div>

            {/* Content */}
            <div className="px-4 -mt-6 relative z-10">
                {/* Main Info Card */}
                <div className="flex w-full gap-4">
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-4 w-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{propertyDetail.name}</h1>
                                <div className="flex items-center gap-2 text-gray-600 mb-3">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm">{propertyDetail.address && `${propertyDetail.address},`} {propertyDetail.street}, {propertyDetail.city} {propertyDetail.postcode}, {propertyDetail.state}</span>
                                </div>
                                {/* <div className="text-3xl font-bold text-gray-900">{property.price}</div> */}
                            </div>

                            {/* <button
                                onClick={() => setIsLiked(!isLiked)}
                                className="w-12 h-12 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/20 hover:bg-white/80 transition-all duration-200"
                            >
                                <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                            </button> */}
                        </div>

                        {/* Property Stats */}
                        <div className='flex justify-center'>
                            <span className='text-sm'>More Details comming Soon</span>
                        </div>
                        {/* <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">{property.bedrooms}</div>
                                <div className="text-xs text-gray-600">Bedrooms</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">{property.bathrooms}</div>
                                <div className="text-xs text-gray-600">Bathrooms</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">{property.parking}</div>
                                <div className="text-xs text-gray-600">Parking</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">{property.area}</div>
                                <div className="text-xs text-gray-600">Area</div>
                            </div>
                        </div> */}
                    </div>

                    {/* Address Details Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-4 w-full">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Adress</span>
                                <span className="font-medium text-gray-900">{propertyDetail.address || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Street</span>
                                <span className="font-medium text-gray-900">{propertyDetail.street || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">City</span>
                                <span className="font-medium text-gray-900">{propertyDetail.city || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Postcode</span>
                                <span className="font-medium text-gray-900">{propertyDetail.postcode || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">State</span>
                                <span className="font-medium text-gray-900">{propertyDetail.state || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROI Program Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-md rounded-3xl shadow-xl border border-blue-100/50 p-6 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">ROI Investment Program</h3>
                            <p className="text-sm text-gray-600">Exclusive opportunity available</p>
                        </div>
                        {/* Status Indicator */}
                        <div>
                            <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${propertyDetail?.propertyRoi?.view_enabled
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                    }`}
                            >
                                {propertyDetail?.propertyRoi?.view_enabled ? "Viewable" : "Not Viewable"}
                            </span>
                        </div>
                    </div>
                    <button
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                        data-modal-toggle="#roi-program-modal"
                    >
                        View ROI Program Details
                    </button>
                </div>

                {/* Image Gallery */}
                {/* <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Gallery</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {property.images.slice(1).map((image, index) => (
                            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
                                <img
                                    src={image}
                                    alt={`Property view ${index + 2}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div> */}

                {/* Image Gallery (Comming Soon) */}
                <div className="bg-white/80 rounded-3xl shadow-xl border border-white/20 p-6 mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200/50 via-purple-200/50 to-pink-200/50 backdrop-blur-xl"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-64">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Gallery</h2>
                        <div className="text-center">
                            <p className="text-gray-600 text-lg font-medium">Feature Coming Soon</p>
                            <p className="text-gray-500 text-sm mt-2">Stay tuned for our upcoming property gallery showcase!</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {/* <div className="grid grid-cols-2 gap-4 pb-8">
                    <button className="bg-white/80 backdrop-blur-md border border-gray-200 text-gray-900 py-4 rounded-2xl font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg flex items-center justify-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Message
                    </button>
                    <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg flex items-center justify-center gap-2">
                        <Phone className="w-5 h-5" />
                        Call Now
                    </button>
                </div> */}
            </div>

            {/* ROI Program Modal */}
            <PreviewROIProgramModal
                property={propertyDetail}
            />
        </div>
    );
};