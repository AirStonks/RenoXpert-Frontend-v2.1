import React from 'react';
import { Star, Shield, Gift, Check } from 'lucide-react';
import { Property } from '../../../../types';

interface ROIProgramModalProps {
    property?: Property;
}

// Reusable SVG Placeholder Component
const NoImagePlaceholder: React.FC<{ width?: string; height?: string; className?: string }> = ({
    width = '100%',
    height = '100%',
    className = '',
}) => (
    <svg width={width} height={height} className={className} viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="200" rx="12" fill="#E5E7EB" />
        <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#6B7280"
            fontSize="20"
            fontFamily="Arial, sans-serif"
            fontWeight="600"
        >
            No Image Available
        </text>
    </svg>
);

export const PreviewROIProgramModal: React.FC<ROIProgramModalProps> = ({ property }) => {
    const iconMap = {
        shield: Shield,
        star: Star,
        gift: Gift,
        check: Check,
    };

    const colorMap = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    };

    return (
        <div className="modal" data-modal="true" id="roi-program-modal">
            <div className="modal-content modal-center-y w-full max-w-[500px] max-h-[800px] bg-white rounded-lg shadow-xl">
                <div className="modal-header py-3 px-5 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-md text-gray-900 font-bold">
                        Choose your ROI for {property?.name || 'Property'}
                    </span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross text-xl"></i>
                    </button>
                </div>
                <div className="modal-body rounded-xl overflow-y-auto scrollable-y-auto">
                    <div className="space-y-4">
                        {/* Hero Image Showcase */}
                        <div className="relative overflow-hidden rounded-xl">
                            {property?.thumbnail_url ? (
                                <img
                                    src={property.thumbnail_url}
                                    alt="Property showcase"
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <NoImagePlaceholder height="12rem" className="w-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="text-lg font-semibold">
                                    {property?.propertyRoi?.thumbnail_title || 'No Title'}
                                </h3>
                                <p className="text-sm opacity-90">
                                    {property?.propertyRoi?.thumbnail_desc}
                                </p>
                            </div>
                        </div>

                        {/* Feature Cards - Matching App component style */}
                        <div className="grid grid-cols-1 gap-3">
                            {property?.propertyRoi?.content?.features?.length > 0 ? (
                                property.propertyRoi.content.features.map((feature, index) => {
                                    const IconComponent = iconMap[feature.icon] || Star;
                                    const colors = colorMap[feature.color] || colorMap.blue;
                                    const title = feature.title || 'Feature';
                                    const description = feature.desc || 'No description available.';

                                    return (
                                        <div
                                            key={index}
                                            className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-lg"
                                        >
                                            <div className={`w-8 h-8 ${colors.bg} rounded-xl flex items-center justify-center mb-3`}>
                                                <IconComponent className={`w-4 h-4 ${colors.text}`} />
                                            </div>
                                            <h4 className="text-xs font-semibold text-gray-900 mb-1">{title}</h4>
                                            <p className="text-2xs text-gray-600">{description}</p>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center p-4 text-gray-600">
                                    <p className="text-sm">No features available for this property.</p>
                                </div>
                            )}
                        </div>

                        {/* Property Gallery - Single Column */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-900">Property Gallery</h4>
                            </div>

                            <div className="space-y-2 pr-2">
                                {property?.propertyRoi?.content?.gallery?.length > 0 ? (
                                    property.propertyRoi.content.gallery.map((item, index) => (
                                        <div key={index} className="relative group cursor-pointer">
                                            {item.url ? (
                                                <img
                                                    src={item.url}
                                                    alt={`Property view ${index + 1}`}
                                                    className="w-full h-full object-cover rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
                                                />
                                            ) : (
                                                <NoImagePlaceholder height="12rem" className="w-full object-cover rounded-lg" />
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-4 text-gray-600">
                                        <NoImagePlaceholder height="12rem" className="w-full object-cover rounded-lg" />
                                        <p className="text-sm mt-2">No gallery images available for this property.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            className="w-full bg-gradient-to-r from-[#D71E42] to-[#a237ef] text-white py-3 rounded-xl hover:from-[#D71E42] hover:to-[#D71E42] transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2"
                            data-modal-dismiss="true"
                        >
                            <Star className="w-4 h-4" />
                            Let's Hop In!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};