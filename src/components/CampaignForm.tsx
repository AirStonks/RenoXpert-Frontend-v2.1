import React, { useState, useEffect } from 'react';
import { Campaign } from '../types';
import { Calendar, Users, FileText, Settings } from 'lucide-react';

interface CampaignFormProps {
    campaign?: Campaign | null;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    mode: 'create' | 'edit';
}

export default function CampaignForm({ 
    campaign, 
    onSubmit, 
    onCancel, 
    isLoading = false, 
    mode 
}: CampaignFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        internal_description: '',
        start_date: '',
        end_date: '',
        slot_total: 0,
        status: 'draft',
        metadata: {
            target_audience: '',
            budget: 0,
            channels: [] as string[],
            goals: [] as string[]
        }
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (campaign && mode === 'edit') {
            setFormData({
                title: campaign.title || '',
                description: campaign.description || '',
                internal_description: campaign.internal_description || '',
                start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
                end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
                slot_total: campaign.slot_total || 0,
                status: campaign.status || 'draft',
                metadata: campaign.metadata ? JSON.parse(campaign.metadata) : {
                    target_audience: '',
                    budget: 0,
                    channels: [],
                    goals: []
                }
            });
        }
    }, [campaign, mode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name.startsWith('metadata.')) {
            const metadataKey = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                metadata: {
                    ...prev.metadata,
                    [metadataKey]: metadataKey === 'budget' ? Number(value) : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'slot_total' ? Number(value) : value
            }));
        }
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'channels' | 'goals') => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [type]: checked 
                    ? [...prev.metadata[type], value]
                    : prev.metadata[type].filter(item => item !== value)
            }
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
            newErrors.end_date = 'End date must be after start date';
        }

        if (formData.slot_total <= 0) {
            newErrors.slot_total = 'Total slots must be greater than 0';
        }

        if (!formData.metadata.target_audience.trim()) {
            newErrors['metadata.target_audience'] = 'Target audience is required';
        }

        if (formData.metadata.budget <= 0) {
            newErrors['metadata.budget'] = 'Budget must be greater than 0';
        }

        if (formData.metadata.channels.length === 0) {
            newErrors.channels = 'At least one marketing channel is required';
        }

        if (formData.metadata.goals.length === 0) {
            newErrors.goals = 'At least one campaign goal is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const submitData = {
            ...formData,
            metadata: JSON.stringify(formData.metadata)
        };

        await onSubmit(submitData);
    };

    const marketingChannels = [
        { value: 'social_media', label: 'Social Media' },
        { value: 'email', label: 'Email Marketing' },
        { value: 'google_ads', label: 'Google Ads' },
        { value: 'facebook_ads', label: 'Facebook Ads' },
        { value: 'content_marketing', label: 'Content Marketing' },
        { value: 'seo', label: 'SEO' },
        { value: 'influencer', label: 'Influencer Marketing' }
    ];

    const campaignGoals = [
        { value: 'lead_generation', label: 'Lead Generation' },
        { value: 'brand_awareness', label: 'Brand Awareness' },
        { value: 'sales_conversion', label: 'Sales Conversion' },
        { value: 'customer_retention', label: 'Customer Retention' },
        { value: 'market_expansion', label: 'Market Expansion' }
    ];

    return (
        <form onSubmit={handleSubmit} className="needs-validation" noValidate>
            <div className="row g-5">
                {/* Basic Information */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Basic Information</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">
                                    Essential campaign details
                                </span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="row g-5">
                                <div className="col-md-6">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            <FileText className="fs-4 text-primary me-2" />
                                            Campaign Title *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            className={`form-control form-control-solid ${errors.title ? 'is-invalid' : ''}`}
                                            placeholder="Enter campaign title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.title && (
                                            <div className="invalid-feedback">{errors.title}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            <Settings className="fs-4 text-primary me-2" />
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            className="form-select form-select-solid"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            <FileText className="fs-4 text-primary me-2" />
                                            Description *
                                        </label>
                                        <textarea
                                            name="description"
                                            className={`form-control form-control-solid ${errors.description ? 'is-invalid' : ''}`}
                                            placeholder="Enter campaign description"
                                            rows={3}
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.description && (
                                            <div className="invalid-feedback">{errors.description}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            <FileText className="fs-4 text-muted me-2" />
                                            Internal Description
                                        </label>
                                        <textarea
                                            name="internal_description"
                                            className="form-control form-control-solid"
                                            placeholder="Enter internal notes (optional)"
                                            rows={2}
                                            value={formData.internal_description}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline & Capacity */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Timeline & Capacity</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">
                                    Campaign duration and slot management
                                </span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="row g-5">
                                <div className="col-md-4">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            <Calendar className="fs-4 text-primary me-2" />
                                            Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className={`form-control form-control-solid ${errors.start_date ? 'is-invalid' : ''}`}
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.start_date && (
                                            <div className="invalid-feedback">{errors.start_date}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            <Calendar className="fs-4 text-primary me-2" />
                                            End Date *
                                        </label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            className={`form-control form-control-solid ${errors.end_date ? 'is-invalid' : ''}`}
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.end_date && (
                                            <div className="invalid-feedback">{errors.end_date}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            <Users className="fs-4 text-primary me-2" />
                                            Total Slots *
                                        </label>
                                        <input
                                            type="number"
                                            name="slot_total"
                                            className={`form-control form-control-solid ${errors.slot_total ? 'is-invalid' : ''}`}
                                            placeholder="Enter total slots"
                                            min="1"
                                            value={formData.slot_total}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.slot_total && (
                                            <div className="invalid-feedback">{errors.slot_total}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campaign Configuration */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Campaign Configuration</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">
                                    Target audience, budget, and marketing strategy
                                </span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="row g-5">
                                <div className="col-md-6">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            Target Audience *
                                        </label>
                                        <input
                                            type="text"
                                            name="metadata.target_audience"
                                            className={`form-control form-control-solid ${errors['metadata.target_audience'] ? 'is-invalid' : ''}`}
                                            placeholder="e.g., Homeowners aged 35-55"
                                            value={formData.metadata.target_audience}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors['metadata.target_audience'] && (
                                            <div className="invalid-feedback">{errors['metadata.target_audience']}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            Budget ($) *
                                        </label>
                                        <input
                                            type="number"
                                            name="metadata.budget"
                                            className={`form-control form-control-solid ${errors['metadata.budget'] ? 'is-invalid' : ''}`}
                                            placeholder="Enter campaign budget"
                                            min="1"
                                            value={formData.metadata.budget}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors['metadata.budget'] && (
                                            <div className="invalid-feedback">{errors['metadata.budget']}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            Marketing Channels *
                                        </label>
                                        <div className="row g-3">
                                            {marketingChannels.map((channel) => (
                                                <div key={channel.value} className="col-md-4">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`channel-${channel.value}`}
                                                            value={channel.value}
                                                            checked={formData.metadata.channels.includes(channel.value)}
                                                            onChange={(e) => handleCheckboxChange(e, 'channels')}
                                                        />
                                                        <label className="form-check-label" htmlFor={`channel-${channel.value}`}>
                                                            {channel.label}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.channels && (
                                            <div className="text-danger fs-7 mt-2">{errors.channels}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex flex-column">
                                        <label className="form-label fw-bold fs-6 mb-2">
                                            Campaign Goals *
                                        </label>
                                        <div className="row g-3">
                                            {campaignGoals.map((goal) => (
                                                <div key={goal.value} className="col-md-4">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`goal-${goal.value}`}
                                                            value={goal.value}
                                                            checked={formData.metadata.goals.includes(goal.value)}
                                                            onChange={(e) => handleCheckboxChange(e, 'goals')}
                                                        />
                                                        <label className="form-check-label" htmlFor={`goal-${goal.value}`}>
                                                            {goal.label}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.goals && (
                                            <div className="text-danger fs-7 mt-2">{errors.goals}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="col-12">
                    <div className="d-flex justify-content-end gap-3">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                                </>
                            ) : (
                                mode === 'create' ? 'Create Campaign' : 'Update Campaign'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
