import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const FAQPage = () => {
    const { campaignSlug } = useParams<{ campaignSlug: string }>();

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
                                    <h1 className="text-base sm:text-lg font-semibold text-gray-900">FAQ</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            to={`/campaigns/${campaignSlug}`}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Campaign</span>
                        </Link>

                        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                            <p className="text-gray-600">Content coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
