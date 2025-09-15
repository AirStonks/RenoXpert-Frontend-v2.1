import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Calendar,
    FileText,
    Settings,
    Users,
    Target,
    AlertCircle,
    X
} from 'lucide-react';
import { updateCampaign } from '../../services/api';
import useFetchCampaign from '../../hook/useFetchCampaign';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

export default function EditCampaign() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        internal_description: '',
        start_date: '',
        end_date: '',
        slot_total: 0,
        base_amount: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const campaignId = id ? parseInt(id, 10) : null;
    const { campaign, loading, error: fetchError } = useFetchCampaign(campaignId);

    useEffect(() => {
        if (campaign) {
            setFormData({
                title: campaign.title || '',
                description: campaign.description || '',
                internal_description: campaign.internal_description || '',
                start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
                end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
                slot_total: campaign.slot_total || 0,
                base_amount: campaign.base_amount || 0
            });
        }
    }, [campaign]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'slot_total' || name === 'base_amount') ? Number(value) : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Campaign Title is required';
        }

        // If either date is filled, both are required
        if (formData.start_date || formData.end_date) {
            if (!formData.start_date) {
                newErrors.start_date = 'Start Date is required when End Date is provided';
            }
            if (!formData.end_date) {
                newErrors.end_date = 'End Date is required when Start Date is provided';
            }
        }

        // If both dates are provided, validate the date range
        if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
            newErrors.end_date = 'End Date must be after Start Date';
        }

        if (formData.slot_total <= 0) {
            newErrors.slot_total = 'Slot number must be greater than 0';
        }

        if (formData.base_amount < 0) {
            newErrors.base_amount = 'Base amount cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await updateCampaign(campaignId!, formData);

            // Navigate back to campaigns list
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
        } catch (err) {
            console.error('Error updating campaign:', err);
            setError('Failed to update campaign. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackClick = () => {
        navigate(`${LOCAL_PATH_PREFIX}campaigns`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">Loading campaign...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (fetchError || !campaign) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20 text-center">
                        <div className="text-red-600 mb-4">
                            <AlertCircle className="mx-auto h-12 w-12" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Campaign</h3>
                        <p className="text-gray-600 mb-4">{fetchError || 'Campaign not found'}</p>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg"
                            onClick={handleBackClick}
                        >
                            Back to Campaigns
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBackClick}
                                className="p-2 rounded-xl bg-white/70 hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-sm border border-white/20"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
                                <p className="text-sm text-gray-600">Update campaign information</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleBackClick}
                                className="px-4 py-2 text-gray-600 bg-white/70 hover:bg-white/90 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm border border-white/20"
                            >
                                <X className="h-4 w-4 inline mr-2" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="h-4 w-4 inline mr-2" />
                                {isSubmitting ? 'Updating...' : 'Update Campaign'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Campaign Details */}
                    <div className="lg:col-span-2">
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Campaign Details</h2>
                                    <p className="text-sm text-gray-600">Basic information about the campaign</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Campaign Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.title
                                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                            }`}
                                        placeholder="Enter campaign title"
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Campaign Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Description (Optional)
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                                        placeholder="Enter campaign description"
                                    />
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.start_date
                                                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                        : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                                    }`}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        </div>
                                        {errors.start_date && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.start_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.end_date
                                                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                        : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                                    }`}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        </div>
                                        {errors.end_date && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.end_date}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Internal Details */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-xl border border-white/20">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                                    <Settings className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Internal Details</h3>
                                    <p className="text-xs text-gray-600">For internal use only</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Internal Description
                                    </label>
                                    <textarea
                                        name="internal_description"
                                        rows={4}
                                        value={formData.internal_description}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-purple-500 transition-all duration-200"
                                        placeholder="Enter internal notes or description"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        This description is for internal use only and will not be visible to external users.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-xl border border-white/20">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-green-100 rounded-xl mr-3">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
                                    <p className="text-xs text-gray-600">Campaign settings</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Slot Number *
                                    </label>
                                    <input
                                        type="number"
                                        name="slot_total"
                                        min="1"
                                        value={formData.slot_total}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.slot_total
                                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                : 'border-gray-200 bg-white/70 focus:border-green-500'
                                            }`}
                                        placeholder="Enter total number of slots"
                                    />
                                    {errors.slot_total && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.slot_total}
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Total number of slots available for this campaign.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Base Amount (RM)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">RM</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="base_amount"
                                            min="0"
                                            step="0.01"
                                            value={formData.base_amount}
                                            onChange={handleInputChange}
                                            className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.base_amount
                                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                    : 'border-gray-200 bg-white/70 focus:border-green-500'
                                                }`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.base_amount && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.base_amount}
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Base amount for this campaign in Malaysian Ringgit (optional).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-xl border border-white/20">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-orange-100 rounded-xl mr-3">
                                    <Target className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                                    <p className="text-xs text-gray-600">Common operations</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="h-4 w-4 inline mr-2" />
                                    {isSubmitting ? 'Updating...' : 'Update Campaign'}
                                </button>
                                <button
                                    onClick={handleBackClick}
                                    className="w-full px-4 py-2 text-gray-600 bg-white/70 hover:bg-white/90 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm border border-white/20"
                                >
                                    <X className="h-4 w-4 inline mr-2" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}